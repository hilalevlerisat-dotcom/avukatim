import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/gemini-embedding';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let { daire, esas_no, karar_no, karar_tarihi, konu, ozet, metin, rawText } = body;

    const geminiKey = process.env.GEMINI_API_KEY;

    // Eğer ham metin verilmişse ve alanlar boşsa, Gemini ile alanları otomatik ayıkla
    if (rawText && (!daire || !ozet) && geminiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const parsePrompt = `Aşağıdaki Türk Mahkemesi / Yargıtay / Danıştay emsal karar metnini analiz et ve JSON olarak döndür:
{
  "daire": "Daire veya Mahkeme adı (Örn: Yargıtay 9. Hukuk Dairesi)",
  "esas_no": "Esas numarası (Örn: 2021/1234)",
  "karar_no": "Karar numarası (Örn: 2022/567)",
  "karar_tarihi": "YYYY-MM-DD formatında tarih (Bulunamazsa null)",
  "konu": "Kararın ana uyuşmazlık konusu (Maksimum 100 karakter)",
  "ozet": "Kararın hukuki ilkesi ve gerekçesinin kısa özeti (2-4 cümle)"
}

Karar Metni:
${rawText.slice(0, 4000)}

Sadece saf JSON döndür, başka hiçbir açıklama yazma.`;

        const parseRes = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: [{ role: 'user', parts: [{ text: parsePrompt }] }]
        });

        const jsonStr = (parseRes.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(jsonStr);

        daire = daire || parsed.daire;
        esas_no = esas_no || parsed.esas_no;
        karar_no = karar_no || parsed.karar_no;
        karar_tarihi = karar_tarihi || parsed.karar_tarihi;
        konu = konu || parsed.konu;
        ozet = ozet || parsed.ozet;
        metin = metin || rawText;
      } catch (parseErr) {
        console.warn('AI ile karar metni ayrıştırma hatası:', parseErr);
        // Fallback: Ham metni özet olarak kullan
        ozet = ozet || rawText.slice(0, 300);
        metin = metin || rawText;
      }
    }

    if (!ozet) {
      return NextResponse.json({ error: 'Karar özeti veya metni zorunludur.' }, { status: 400 });
    }

    // Embedding oluştur
    const textToEmbed = `${daire || ''} ${esas_no || ''} ${karar_no || ''}. Konu: ${konu || ''}. Özet: ${ozet}`;
    const embedding = await generateEmbedding(textToEmbed);

    const supabase = await createClient();

    const record: any = {
      daire: daire || 'Yargıtay İlgili Dairesi',
      esas_no: esas_no || 'Belirtilmedi',
      karar_no: karar_no || 'Belirtilmedi',
      karar_tarihi: karar_tarihi || null,
      konu: konu || 'Hukuki Uyuşmazlık',
      ozet,
      metin: metin || null,
    };

    if (embedding) {
      record.embedding = embedding;
    }

    const { data, error } = await (supabase
      .from('emsal_kararlar') as any)
      .insert(record)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Kayıt eklenemedi: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      decision: data,
      message: 'Emsal karar başarıyla veritabanına eklendi ve semantik arama için indekslendi.'
    });

  } catch (err: any) {
    console.error('Emsal Ekleme Hatası:', err);
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu: ' + err.message }, { status: 500 });
  }
}
