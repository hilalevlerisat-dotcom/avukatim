import { GoogleGenAI } from '@google/genai'

/**
 * Ã‡oklu yapay zeka saÄŸlayÄ±cÄ± zinciri.
 * SÄ±rayla dener, hangisi mÃ¼saitse (anahtar tanÄ±mlÄ± + kota var) onu kullanÄ±r.
 * TanÄ±mlÄ± olmayan saÄŸlayÄ±cÄ±lar (env anahtarÄ± yok) otomatik atlanÄ±r.
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
  // Ãœcretsiz katmanÄ± olanlar
  { name: 'Groq', envKey: 'GROQ_API_KEY', baseUrl: 'https://api.groq.com/openai/v1', models: ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'] },
  { name: 'OpenRouter', envKey: 'OPENROUTER_API_KEY', baseUrl: 'https://openrouter.ai/api/v1', models: ['openrouter/free', 'nvidia/nemotron-3-super-120b-a12b:free', 'nvidia/nemotron-3-ultra-550b-a55b:free', 'google/gemma-4-31b-it:free'] },
  { name: 'Mistral', envKey: 'MISTRAL_API_KEY', baseUrl: 'https://api.mistral.ai/v1', models: ['mistral-small-latest'] },
  // Ãœcretli/ucuz (anahtar varsa)
  { name: 'DeepSeek', envKey: 'DEEPSEEK_API_KEY', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat'] },
  { name: 'OpenAI', envKey: 'OPENAI_API_KEY', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4o-mini'] },
]

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.7-flash', 'gemini-flash-latest']

/** Vercel fonksiyon sÃ¼resini aÅŸmamak iÃ§in toplam sÃ¼re bÃ¼tÃ§esi (ms) */
const TOTAL_BUDGET_MS = 50000

async function callOpenAICompat(
  p: OpenAICompat,
  prompt: string,
  temperature: number,
  errors: string[],
  deadline: number,
  accept: (text: string) => boolean,
  onWeak: (text: string, label: string) => void
): Promise<string> {
  const key = process.env[p.envKey]
  if (!key) return ''
  for (const model of p.models) {
    const remaining = deadline - Date.now()
    if (remaining < 4000) {
      errors.push(`${p.name}: sÃ¼re doldu`)
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
      if (res.ok && text && String(text).trim()) {
        if (accept(String(text))) return String(text)
        onWeak(String(text), `${p.name}/${model}`)
        errors.push(`${p.name}/${model}: karar numarasÄ± iÃ§ermiyor, sonraki model deneniyor`)
        continue
      }
      errors.push(`${p.name}/${model}: ${res.status} ${String(data?.error?.message || 'boÅŸ yanÄ±t').slice(0, 120)}`)
    } catch (e: any) {
      errors.push(`${p.name}/${model}: ${String(e?.message || e).slice(0, 120)}`)
    }
  }
  return ''
}

type Source = { title: string; uri: string }

/** Tavily (Ã¼cretsiz 1000/ay) */
async function tavilySearch(query: string): Promise<{ context: string; sources: Source[] }> {
  const key = process.env.TAVILY_API_KEY
  if (!key) return { context: '', sources: [] }
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query: `${query} YargÄ±tay karar esas karar`, max_results: 8, search_depth: 'advanced' }),
      signal: AbortSignal.timeout(9000),
    })
    const data: any = await res.json()
    const results: any[] = data?.results || []
    return {
      context: results.map((r, i) => `[KAYNAK ${i + 1}] ${r.title}\n${r.url}\n${String(r.content || '').slice(0, 1500)}`).join('\n\n'),
      sources: results.map(r => ({ title: r.title || r.url, uri: r.url })),
    }
  } catch {
    return { context: '', sources: [] }
  }
}

/** AnahtarsÄ±z yedek: DuckDuckGo HTML sonuÃ§larÄ± (en iyi Ã§aba) */
async function duckSearch(query: string): Promise<{ context: string; sources: Source[] }> {
  try {
    const q = encodeURIComponent(`${query} YargÄ±tay Hukuk Dairesi E. K. karar`)
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${q}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36', 'Accept-Language': 'tr-TR,tr;q=0.9' },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()
    const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim()
    const items: { title: string; url: string; snippet: string }[] = []
    const re = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html)) !== null && items.length < 8) {
      let url = m[1]
      const u = /uddg=([^&]+)/.exec(url)
      if (u) url = decodeURIComponent(u[1])
      else if (url.startsWith('//')) url = 'https:' + url
      items.push({ title: strip(m[2]), url, snippet: strip(m[3]) })
    }
    return {
      context: items.map((r, i) => `[KAYNAK ${i + 1}] ${r.title}\n${r.url}\n${r.snippet}`).join('\n\n'),
      sources: items.map(r => ({ title: r.title || r.url, uri: r.url })),
    }
  } catch {
    return { context: '', sources: [] }
  }
}

/** CanlÄ± web sonuÃ§larÄ± â€” Gemini dÄ±ÅŸÄ± modeller iÃ§in kaynak saÄŸlar (Tavily, olmazsa DuckDuckGo). */
export async function webSearchContext(query: string): Promise<{ context: string; sources: Source[] }> {
  const t = await tavilySearch(query)
  if (t.context) return t
  return duckSearch(query)
}

/**
 * @param prompt        Nihai prompt (Gemini iÃ§in)
 * @param opts.search   true ise Gemini'de Google Search kullanÄ±lÄ±r; diÄŸer saÄŸlayÄ±cÄ±larda web baÄŸlamÄ± eklenir
 * @param opts.buildFallbackPrompt  Gemini dÄ±ÅŸÄ± saÄŸlayÄ±cÄ±lar iÃ§in prompt Ã¼retici (web baÄŸlamÄ± verilir)
 * @param opts.validate YanÄ±tÄ±n "yeterli" olup olmadÄ±ÄŸÄ±nÄ± denetler (Ã¶rn. karar numarasÄ± iÃ§eriyor mu).
 *                      GeÃ§mezse sÄ±radaki model denenir; hiÃ§biri geÃ§mezse en iyi zayÄ±f yanÄ±t dÃ¶ner.
 */
export async function generateWithFallback(
  prompt: string,
  opts: {
    search?: boolean
    temperature?: number
    searchQuery?: string
    buildFallbackPrompt?: (webContext: string) => string
    validate?: (text: string) => boolean
  } = {}
): Promise<{ result: GenResult | null; errors: string[] }> {
  const errors: string[] = []
  const temperature = opts.temperature ?? 0.3
  const deadline = Date.now() + TOTAL_BUDGET_MS
  const validate = opts.validate ?? (() => true)
  let weak: GenResult | null = null

  // 1) Gemini
  const geminiKey = process.env.GEMINI_API_KEY
  if (geminiKey) {
    const ai = new GoogleGenAI({ apiKey: geminiKey })
    for (const model of GEMINI_MODELS) {
      // Gemini'ye en fazla ~25 sn ayÄ±r, diÄŸer saÄŸlayÄ±cÄ±lara sÃ¼re kalsÄ±n
      const gemRemaining = Math.min(25000, deadline - Date.now() - 20000)
      if (gemRemaining < 3000) {
        errors.push('Gemini: sÃ¼re ayrÄ±lan sÄ±nÄ±ra ulaÅŸtÄ±')
        break
      }
      try {
        const res: any = await Promise.race([
          ai.models.generateContent({
            model,
            contents: prompt,
            config: { temperature, ...(opts.search ? { tools: [{ googleSearch: {} }] } : {}) },
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('zaman aÅŸÄ±mÄ±')), gemRemaining)),
        ])
        const t = res?.text
        if (t && t.trim()) {
          const chunks = res?.candidates?.[0]?.groundingMetadata?.groundingChunks || []
          const sources = chunks.filter((c: any) => c?.web?.uri).map((c: any) => ({ title: c.web.title || c.web.uri, uri: c.web.uri }))
          const r: GenResult = { text: t, provider: `Gemini (${model})`, sources }
          if (validate(t)) return { result: r, errors }
          weak = weak || r
          errors.push(`Gemini/${model}: karar numarasÄ± iÃ§ermiyor`)
          continue
        }
        errors.push(`Gemini/${model}: boÅŸ yanÄ±t`)
      } catch (e: any) {
        errors.push(`Gemini/${model}: ${String(e?.message || e).slice(0, 120)}`)
      }
    }
  } else {
    errors.push('Gemini: anahtar yok')
  }

  // 2) DiÄŸer saÄŸlayÄ±cÄ±lar (web baÄŸlamÄ± ile)
  let webContext = ''
  let webSources: Source[] = []
  if (opts.search && opts.searchQuery) {
    const w = await webSearchContext(opts.searchQuery)
    webContext = w.context
    webSources = w.sources
    if (!webContext) errors.push('Web aramasÄ±: sonuÃ§ alÄ±namadÄ± (TAVILY_API_KEY ekleyin)')
  }
  const fallbackPrompt = opts.buildFallbackPrompt ? opts.buildFallbackPrompt(webContext) : prompt
  // Web baÄŸlamÄ± yoksa model karar numarasÄ± veremez; ilk baÅŸarÄ±lÄ± yanÄ±t kabul edilir
  const needsValidation = !opts.search || !!webContext

  for (const p of OPENAI_COMPAT) {
    const text = await callOpenAICompat(
      p,
      fallbackPrompt,
      temperature,
      errors,
      deadline,
      t => (needsValidation ? validate(t) : true),
      (t, label) => {
        weak = weak || { text: t, provider: label, sources: webSources }
      }
    )
    if (text) return { result: { text, provider: p.name, sources: webSources }, errors }
  }

  return { result: weak, errors }
}
