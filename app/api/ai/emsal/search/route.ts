import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';
import { generateEmbedding } from '@/lib/gemini-embedding';

export async function POST(req: Request) {
  try {
    const { query, threshold = 0.45, limit = 5 } = await req.json();

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Arama sorgusu zorunludur.' }, { status: 400 });
    }

    const cleanQuery = query.trim();
    const supabase = await createClient();

    // 1. Sorgu için Gemini Vektör Embedding üret
    const queryEmbedding = await generateEmbedding(cleanQuery);

    let matchedDecisions: any[] = [];

    // 2. Vektör varsa Supabase pgvector RPC ile en yakın kararları bul
    if (queryEmbedding && queryEmbedding.length === 768) {
      const { data: rpcData, error: rpcError } = await (supabase as any).rpc('match_emsal_kararlar', {
        query_embedding: queryEmbedding,
        match_threshold: Number(threshold),
        match_count: Number(limit)
      });

      if (!rpcError && rpcData && rpcData.length > 0) {
        matchedDecisions = rpcData;
      } else if (rpcError) {
        console.warn('RPC Hatası, fallback metin aramasına geçiliyor:', rpcError.message);
      }
    }

    // 3. Fallback: Eğer vektör aramasından sonuç gelmediyse veya API key yoksa metin bazlı arama yap
    if (matchedDecisions.length === 0) {
      // Kelimeleri ayırıp arat
      const keywords = cleanQuery.split(/\s+/).filter(w => w.length > 2);
      let queryBuilder = (supabase.from('emsal_kararlar') as any)
        .select('id, daire, esas_no, karar_no, karar_tarihi, konu, ozet, metin')
        .limit(limit);

      if (keywords.length > 0) {
        // En az bir kelime içerenleri getir
        const orFilter = keywords.map(kw => `konu.ilike.%${kw}%,ozet.ilike.%${kw}%`).join(',');
        queryBuilder = queryBuilder.or(orFilter);
      }

      const { data: textData } = await queryBuilder;
      if (textData && textData.length > 0) {
        matchedDecisions = textData.map((d: any) => ({
          ...d,
          similarity: 0.70 // Metin eşleşmesi tahmini skor
        }));
      }
    }

    let aiAnalysis = '';
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        
        let systemPrompt = '';
        let prompt = '';

        if (matchedDecisions.length > 0) {
          // KARARLAR BULUNDU: KATI RAG MODU
          const contextText = matchedDecisions.map((d, i) => `
[KARAR ${i + 1}]
- Mahkeme / Daire: ${d.daire}
- Esas No: ${d.esas_no} | Karar No: ${d.karar_no}
- Karar Tarihi: ${d.karar_tarihi || 'Belirtilmemiş'}
- Konu: ${d.konu}
- Yasal Gerekçe ve Özet: ${d.ozet}
`).join('\n---\n');

          systemPrompt = `Sen bir Kıdemli Hukuk Müşaviri ve Yargıtay İçtihat Analistisin.
GÖREVİN: Kullanıcının sorusunu, YALNIZCA AŞAĞIDA VERİLEN DOĞRULANMIŞ EMSAL KARARLARI temel alarak hukuki açıdan değerlendirmektir.

🚨🚨🚨 ÇOK KATI HALÜSİNASYON VE DOĞRULUK KURALLARI 🚨🚨🚨:
1. ASLA aşağıda verilen kararlar haricinde kafandan/eğitim verinden başka bir karar, Esas No, Karar No, Mahkeme veya Daire UYDURMA.
2. Sunduğun her hukuki kuralı mutlaka ilgili karara atıfta bulunarak parantez içinde belirt (Örnek format: [Yargıtay 9. HD, E. 2021/11245, K. 2022/1534]).
3. Eğer aşağıdaki kararlar kullanıcının sorusunu yüzde yüz aydınlatmıyorsa açıkça belirt.
4. Çıktını aşağıdaki Markdown başlıklarıyla yapılandır:

### ⚖️ Hukuki Sonuç & İçtihat Özeti
### 📌 Uygulanacak Şartlar ve İspat Kuralları
### 📑 Dayanılan Doğrulanmış Emsal Kararlar`;
          
          prompt = `KULLANICININ HUKUKİ SORUSU:\n"${cleanQuery}"\n\nVERİTABANINDAN GETİRİLEN DOĞRULANMIŞ EMSAL KARARLAR:\n${contextText}`;
        } else {
          // KARAR BULUNAMADI: GOOGLE ARAMA AJANI (WEB SEARCH AGENT)
          systemPrompt = `Sen bir Kıdemli Hukuk Müşaviri ve Yargıtay İçtihat Analistisin. 
Kullanıcının sorusuna yönelik özel veritabanımızda birebir eşleşen emsal karar bulunamadığı için Google Arama aracını (Google Search Tool) kullanarak internetteki GÜNCEL VE GERÇEK Yargıtay / Danıştay / AYM kararlarını araştırmakla görevlisin.

🚨🚨🚨 ÇOK KATI HALÜSİNASYON VE DOĞRULUK KURALLARI 🚨🚨🚨:
1. Google'da derinlemesine arama yap ve bulduğun GERÇEK mahkeme kararlarını (Esas No, Karar No, Mahkeme/Daire ve Tarih) mutlaka belirt.
2. ASLA kafandan karar numarası uydurma. Sadece arama sonuçlarında gerçekten var olan kararları alıntıla.
3. Çıktının en başına mutlaka şu uyarıyı koy: "> 🌐 **Web Ajanı Notu:** Veritabanınızda bu konuya birebir uyan içtihat bulunamadığı için, yapay zeka ajanımız internette canlı arama yaparak aşağıdaki güncel kararları sizin için bulmuştur."
4. Çıktını aşağıdaki Markdown başlıklarıyla yapılandır:

### ⚖️ Hukuki Sonuç & İçtihat Özeti
### 📌 Uygulanacak Şartlar ve İspat Kuralları
### 📑 İnternetten Bulunan Emsal Kararlar`;

          prompt = `Lütfen Google Arama aracını kullanarak şu hukuki soru için güncel Yargıtay/Danıştay kararlarını araştır ve hukuki bir değerlendirme sun:\n"${cleanQuery}"`;
        }

        const modelsToTry = [
          'gemini-2.0-flash',
          'gemini-2.0-flash-lite-preview-02-05',
          'gemini-1.5-pro',
          'gemini-1.5-flash',
        ];

        let genResponse = null;
        for (const model of modelsToTry) {
          try {
            const reqConfig: any = {
              temperature: matchedDecisions.length > 0 ? 0.1 : 0.4
            };
            
            // Eğer veritabanında karar yoksa web araması (Google Search Grounding) yapmasına izin ver
            if (matchedDecisions.length === 0) {
              reqConfig.tools = [{ googleSearch: {} }];
            }

            genResponse = await ai.models.generateContent({
              model,
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
                }
              ],
              config: reqConfig
            });
            break;
          } catch (modelErr) {
            console.warn(`Model ${model} denendi, başarısız:`, modelErr);
          }
        }

        if (genResponse && genResponse.text) {
          aiAnalysis = genResponse.text;
        }
      } catch (aiErr: any) {
        console.error('Gemini Analiz Hatası:', aiErr);
      }
    }

    // Eğer Gemini yanıtı alınamadıysa veya key yoksa, deterministik güvenli özet üret
    if (!aiAnalysis) {
      if (matchedDecisions.length > 0) {
        aiAnalysis = `### ⚖️ Hukuki Sonuç & İçtihat Özeti\nVeritabanında sorgunuza karşılık gelen **${matchedDecisions.length} adet doğrulanmış emsal karar** tespit edildi.\n\n` +
          matchedDecisions.map(d => `- **${d.daire} (${d.esas_no} / ${d.karar_no})**: ${d.ozet}`).join('\n\n') +
          `\n\n> 🛡️ *Halüsinasyon Koruması: Bu sonuçlar doğrudan veritabanındaki resmi Yargıtay kayıtlarından derlenmiştir.*`;
      } else {
        return NextResponse.json({
          success: true,
          query: cleanQuery,
          matchedCount: 0,
          decisions: [],
          analysis: null,
          message: 'Canlı web taraması sırasında yapay zeka servisine erişilemedi veya sorgunuza uygun yeterli içtihat tespit edilemedi.'
        });
      }
    }

    return NextResponse.json({
      success: true,
      query: cleanQuery,
      matchedCount: matchedDecisions.length,
      decisions: matchedDecisions,
      analysis: aiAnalysis
    });

  } catch (error: any) {
    console.error('Emsal Arama API Hatası:', error);
    return NextResponse.json({ error: 'Arama sırasında bir hata oluştu: ' + error.message }, { status: 500 });
  }
}
