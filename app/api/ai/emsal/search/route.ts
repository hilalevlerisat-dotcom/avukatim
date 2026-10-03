import { NextResponse } from 'next/server';
import { generateWithFallback } from '@/lib/ai-providers';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Arama sorgusu zorunludur.' }, { status: 400 });
    }

    const cleanQuery = query.trim();

    const systemPrompt = `Sen bir Kıdemli Hukuk Müşaviri ve Yargıtay İçtihat Analistisin.
KATI KURALLAR:
1. Sadece gerçekten bulduğun/verilen kaynaklardaki kararları (Daire, Esas No, Karar No, Tarih) belirt.
2. ASLA karar numarası uydurma. Emin değilsen "belirtilmemiş" yaz.
3. Çıktının en başına şunu koy: "> 🌐 **Web Ajanı Notu:** Aşağıdaki kararlar canlı internet araması ile bulunmuştur."
4. Çıktıyı şu Markdown başlıklarıyla yapılandır:

### ⚖️ Hukuki Sonuç & İçtihat Özeti
### 📌 Uygulanacak Şartlar ve İspat Kuralları
### 📑 İnternetten Bulunan Emsal Kararlar`;

    // Gemini: Google Search ile kendisi arar
    const geminiPrompt = `${systemPrompt}\n\nGoogle Arama aracını kullanarak güncel Yargıtay/Danıştay/AYM kararlarını araştır.\nHukuki soru:\n"${cleanQuery}"`;

    // Diğer modeller: Tavily web sonuçları verilir; sonuç yoksa karar numarası vermeleri yasaklanır
    const buildFallbackPrompt = (webContext: string) =>
      webContext
        ? `${systemPrompt}\n\nYALNIZCA aşağıdaki web arama sonuçlarına dayan; sonuçlarda geçmeyen karar numarası YAZMA.\n\nHukuki soru:\n"${cleanQuery}"\n\nWEB ARAMA SONUÇLARI:\n${webContext}`
        : `Sen bir Kıdemli Hukuk Müşavirisin. İnternet erişimin YOK. Bu yüzden ASLA Esas No / Karar No / tarih verme veya uydurma.\nSadece konuyla ilgili genel hukuki ilkeleri, ilgili kanun maddelerini ve Yargıtay'ın bu konudaki genel yerleşik yaklaşımını anlat; en başa şunu koy: "> ⚠️ **Not:** Canlı web araması yapılamadı, aşağıda kesin karar numarası yoktur. Karar numaralarını UYAP/Kazancı/Lexpera'da doğrulayın."\nBaşlıklar: ### ⚖️ Hukuki Sonuç & İçtihat Özeti, ### 📌 Uygulanacak Şartlar ve İspat Kuralları, ### 🔎 Araştırılması Önerilen Anahtar Kelimeler\n\nHukuki soru:\n"${cleanQuery}"`;

    const { result, errors } = await generateWithFallback(geminiPrompt, {
      search: true,
      temperature: 0.3,
      searchQuery: cleanQuery,
      buildFallbackPrompt,
    });

    if (!result) {
      return NextResponse.json({
        success: true,
        query: cleanQuery,
        matchedCount: 0,
        decisions: [],
        analysis: null,
        message: 'Hiçbir yapay zeka servisine ulaşılamadı. Teknik detay: ' + errors.join(' | ')
      });
    }

    let text = result.text;
    if (result.sources.length > 0) {
      const seen = new Set<string>();
      const uniq = result.sources.filter(s => (seen.has(s.uri) ? false : (seen.add(s.uri), true)));
      text += `\n\n### 🔗 Kaynaklar\n` + uniq.map(s => `- [${s.title}](${s.uri})`).join('\n');
    }
    text += `\n\n---\n*Yanıtı üreten servis: ${result.provider}*`;

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      matchedCount: result.sources.length,
      decisions: [],
      analysis: text
    });
  } catch (error: any) {
    console.error('Emsal Arama API Hatası:', error);
    return NextResponse.json({ error: 'Arama sırasında bir hata oluştu: ' + error.message }, { status: 500 });
  }
}
