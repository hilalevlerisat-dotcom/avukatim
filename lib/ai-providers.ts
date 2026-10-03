import { GoogleGenAI } from '@google/genai'

/**
 * Çoklu yapay zeka sağlayıcı zinciri.
 * Sırayla dener, hangisi müsaitse (anahtar tanımlı + kota var) onu kullanır.
 * Tanımlı olmayan sağlayıcılar (env anahtarı yok) otomatik atlanır.
 */

export interface GenResult {
  text: string
  provider: string
  sources: { title: string; uri: string }[]
}

interface OpenAICompat {
  name: string
  envKey: string
  baseUrl: string
  models: string[]
}

const OPENAI_COMPAT: OpenAICompat[] = [
  // Ücretsiz katmanı olanlar
  { name: 'Groq', envKey: 'GROQ_API_KEY', baseUrl: 'https://api.groq.com/openai/v1', models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'] },
  { name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY', baseUrl: 'https://openrouter.ai/api/v1', models: ['openrouter/free', 'nvidia/nemotron-3-super-120b-a12b:free', 'nvidia/nemotron-3-ultra-550b-a55b:free', 'google/gemma-4-31b-it:free'] },
  { name: 'Mistral', envKey: 'MISTRAL_API_KEY', baseUrl: 'https://api.mistral.ai/v1', models: ['mistral-small-latest'] },
  // Ücretli/ucuz (anahtar varsa)
  { name: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat'] },
  { name: 'OpenAI', envKey: 'OPENAI_API_KEY', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o-mini'] },
]

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.7-flash', 'gemini-flash-latest']

/** Vercel fonksiyon süresini aşmamak için toplam süre bütçesi (ms) */
const TOTAL_BUDGET_MS = 50000

async function callOpenAICompat(p: OpenAICompat, prompt: string, temperature: number, errors: string[], deadline: number): Promise<string> {
  const key = process.env[p.envKey]
  if (!key) return ''
  for (const model of p.models) {
    const remaining = deadline - Date.now()
    if (remaining < 4000) {
      errors.push(`${p.name}: süre doldu`)
      return ''
    }
    try {
      const res = await fetch(`${p.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, temperature, max_tokens: 3000, messages: [{ role: 'user', content: prompt }] }),
        signal: AbortSignal.timeout(Math.min(remaining - 1000, 18000)),
      })
      const data: any = await res.json().catch(() => ({}))
      const text = data?.choices?.[0]?.message?.content
      if (res.ok && text && String(text).trim()) return String(text)
      errors.push(`${p.name}/${model}: ${res.status} ${String(data?.error?.message || 'boş yanıt').slice(0, 120)}`)
    } catch (e: any) {
      errors.push(`${p.name}/${model}: ${String(e?.message || e).slice(0, 120)}`)
    }
  }
  return ''
}

/** Tavily ile (ücretsiz 1000/ay) canlı web sonuçları — Gemini dışı modeller için kaynak sağlar. */
export async function webSearchContext(query: string): Promise<{ context: string; sources: { title: string; uri: string }[] }> {
  const key = process.env.TAVILY_API_KEY
  if (!key) return { context: '', sources: [] }
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query: `${query} Yargıtay karar esas karar`, max_results: 6, search_depth: 'advanced' }),
      signal: AbortSignal.timeout(8000),
    })
    const data: any = await res.json()
    const results: any[] = data?.results || []
    return {
      context: results.map((r, i) => `[KAYNAK ${i + 1}] ${r.title}\n${r.url}\n${String(r.content || '').slice(0, 1200)}`).join('\n\n'),
      sources: results.map(r => ({ title: r.title || r.url, uri: r.url })),
    }
  } catch {
    return { context: '', sources: [] }
  }
}

/**
 * @param prompt        Nihai prompt (Gemini için)
 * @param opts.search   true ise Gemini'de Google Search kullanılır; diğer sağlayıcılarda Tavily bağlamı eklenir
 * @param opts.fallbackPrompt  Gemini dışı sağlayıcılar için prompt üretici (web bağlamı verilir)
 */
export async function generateWithFallback(
  prompt: string,
  opts: { search?: boolean; temperature?: number; searchQuery?: string; buildFallbackPrompt?: (webContext: string) => string } = {}
): Promise<{ result: GenResult | null; errors: string[] }> {
  const errors: string[] = []
  const temperature = opts.temperature ?? 0.3
  const deadline = Date.now() + TOTAL_BUDGET_MS

  // 1) Gemini
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiKey })
    for (const model of GEMINI_MODELS) {
      // Gemini'ye en fazla ~25 sn ayır, diğer sağlayıcılara süre kalsın
      const gemRemaining = Math.min(25000, deadline - Date.now() - 20000)
      if (gemRemaining < 3000) {
        errors.push('Gemini: süre ayrılan sınıra ulaştı')
        break
      }
      try {
        const res: any = await Promise.race([
          ai.models.generateContent({
            model,
            contents: prompt,
            config: { temperature, ...(opts.search ? { tools: [{ googleSearch: {} }] } : {}) },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('zaman aşımı')), gemRemaining)),
        ])
        const t = res?.text
        if (t && t.trim()) {
          const chunks = res?.candidates?.[0]?.groundingMetadata?.groundingChunks || []
          const sources = chunks.filter((c: any) => c?.web?.uri).map((c: any) => ({ title: c.web.title || c.web.uri, uri: c.web.uri }))
          return { result: { text: t, provider: `Gemini (${model})`, sources }, errors }
        }
        errors.push(`Gemini/${model}: boş yanıt`)
      } catch (e: any) {
        errors.push(`Gemini/${model}: ${String(e?.message || e).slice(0, 120)}`)
      }
    }
  } else {
    errors.push('Gemini: anahtar yok')
  }

  // 2) Diğer sağlayıcılar
  let webContext = ''
  let webSources: { title: string; uri: string }[] = []
  if (opts.search && opts.searchQuery) {
    const w = await webSearchContext(opts.searchQuery)
    webContext = w.context
    webSources = w.sources
  }
  const fallbackPrompt = opts.buildFallbackPrompt ? opts.buildFallbackPrompt(webContext) : prompt

  for (const p of OPENAI_COMPAT) {
    const text = await callOpenAICompat(p, fallbackPrompt, temperature, errors, deadline)
    if (text) return { result: { text, provider: p.name, sources: webSources }, errors }
  }

  return { result: null, errors }
}
