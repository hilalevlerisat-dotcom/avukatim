import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Arama sorgusu zorunludur.' }, { status: 400 });
    }

    const cleanQuery = query.trim();
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!geminiKey) {
      return NextResponse.json({
        success: true,
        query: cleanQuery,
        matchedCount: 0,
        decisions: [],
        analysis: null,
        message: 'GEMINI_API_KEY ortam değişkeni tanımlı değil. Vercel > Settings > Environment Variables bölümüne ekleyip yeniden deploy edin.'
      });
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });

    const systemPrompt = `Sen bir Kıdemli Hukuk Müşaviri ve Yargıtay İçtihat Analistisin.
Google Arama aracını kullanarak internetteki GÜNCEL VE GERÇEK Yargıtay / Danıştay / AYM kararlarını araştır.

KATI KURALLAR:
1. Sadece arama sonuçlarında gerçekten bulduğun kararları (Daire, Esas No, Karar No, Tarih) belirt.
2. ASLA karar numarası uydurma. Emin değilsen o bilgiyi "belirtilmemiş" yaz.
3. Çıktının en başına şunu koy: "> 🌐 **Web Ajanı Notu:** Aşağıdaki kararlar canlı internet araması ile bulunmuştur."
4. Çıktıyı şu Markdown başlıklarıyla yapılandır:

### ⚖️ Hukuki Sonuç & İçtihat Özeti
### 📌 Uygulanacak Şartlar ve İspat Kuralları
### 📑 İnternetten Bulunan Emsal Kararlar`;

    const prompt = `${systemPrompt}\n\nHukuki soru:\n"${cleanQuery}"`;

    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.5-pro', 'gemini-flash-latest'];

    let text = '';
    let sources: { title: string; uri: string }[] = [];
    const errors: string[] = [];

    for (const model of modelsToTry) {
      try {
        const res: any = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { tools: [{ googleSearch: {} }], temperature: 0.3 }
        });

        const t = res?.text;
        if (t && t.trim()) {
          text = t;
          const chunks = res?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          sources = chunks
            .filter((c: any) => c?.web?.uri)
            .map((c: any) => ({ title: c.web.title || c.web.uri, uri: c.web.uri }));
          break;
        }
        errors.push(`${model}: boş yanıt`);
      } catch (e: any) {
        console.warn(`Model ${model} başarısız:`, e?.message || e);
        errors.push(`${model}: ${String(e?.message || e).slice(0, 200)}`);
      }
    }

    if (!text) {
      return NextResponse.json({
        success: true,
        query: cleanQuery,
        matchedCount: 0,
        decisions: [],
        analysis: null,
        message: 'Canlı web taraması başarısız oldu. Teknik detay: ' + errors.join(' | ')
      });
    }

    if (sources.length > 0) {
      const seen = new Set<string>();
      const uniq = sources.filter(s => (seen.has(s.uri) ? false : (seen.add(s.uri), true)));
      text += `\n\n### 🔗 Kaynaklar\n` + uniq.map(s => `- [${s.title}](${s.uri})`).join('\n');
    }

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      matchedCount: sources.length,
      decisions: [],
      analysis: text
    });
  } catch (error: any) {
    console.error('Emsal Arama API Hatası:', error);
    return NextResponse.json({ error: 'Arama sırasında bir hata oluştu: ' + error.message }, { status: 500 });
  }
}
