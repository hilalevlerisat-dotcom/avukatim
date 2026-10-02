import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';
export async function POST(req: Request) {
  try {
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Belge kaydını getir
    const { data: rawDoc, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !rawDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const doc = rawDoc as any;

    const isPdf = doc.file_type === 'pdf' || (doc.file_name && doc.file_name.toLowerCase().endsWith('.pdf'));
    if (!isPdf) {
      return NextResponse.json({ error: 'Şu anlık sadece PDF dosyaları özetlenebilir.' }, { status: 400 });
    }

    // 2. Belgeyi Supabase Storage'dan indir
    const computedStoragePath = doc.file_path || doc.storage_path || (doc.case_id ? `${doc.user_id}/cases/${doc.case_id}/${doc.file_name}` : (doc.client_id ? `${doc.user_id}/clients/${doc.client_id}/${doc.file_name}` : `${doc.user_id}/general/${doc.file_name}`))
    const { data: fileData, error: downloadError } = await supabase
      .storage
      .from('documents')
      .download(computedStoragePath);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Dosya indirilemedi' }, { status: 500 });
    }

    // 3. Dosyayı Base64'e çevir (Gemini native PDF desteği için)
    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    let summaryText = '';

    // 4. Gemini API ile özetle (Eğer API Key yoksa Mock döner)
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const prompt = `
Sen kıdemli bir hukuk bürosu asistanısın. Görevin, ekteki hukuki belgeyi (dilekçe, karar, sözleşme, bilirkişi raporu vb.) analiz etmektir.
Lütfen aşağıdaki formatta bir çıktı üret (Formatı birebir koru, Markdown kullan):

**YÖNETİCİ ÖZETİ**
Belgenin temel amacı ve sonucu (Maksimum 3 cümle).

**KRONOLOJİ & ÖNEMLİ TARİHLER**
- Belgede geçen tarihleri sırasına göre madde madde listele.

**RİSKLER / DİKKAT EDİLMESİ GEREKENLER**
- Belgedeki müvekkil aleyhine olabilecek riskli maddeleri veya müvekkil lehine kullanılabilecek argümanları kısa maddeler halinde belirt.
`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: 'application/pdf',
                    data: base64Data
                  }
                }
              ]
            }
          ]
        });
        summaryText = response.text || 'Özet oluşturulamadı.';
      } catch (aiError: any) {
        console.error('Gemini API Error:', aiError);
        return NextResponse.json({ error: 'Yapay Zeka API hatası: ' + aiError.message }, { status: 500 });
      }
    } else {
      // Mock Fallback
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
      summaryText = `**YÖNETİCİ ÖZETİ**
Sistemde GEMINI_API_KEY bulunmadığı için bu metin simüle edilmiştir. Bu belge, ${doc.file_name} adlı dosyadan başarıyla alınmıştır.

**KRONOLOJİ & ÖNEMLİ TARİHLER**
- **${new Date().toLocaleDateString('tr-TR')}**: Dosya sisteme yüklendi.
- **Geçmiş Tarih**: Belge içerisinde geçen spesifik olay tarihleri burada listelenir.

**RİSKLER / DİKKAT EDİLMESİ GEREKENLER**
- API anahtarı girildiğinde, metin içindeki riskli maddeler (örn: faiz oranları, süre kısıtlamaları, cezai şartlar) yapay zeka tarafından bu alanda otomatik listelenecektir.
- *Not: Gerçek yapay zeka entegrasyonu için lütfen .env.local dosyasına GEMINI_API_KEY ekleyin.*`;
    }

    // 5. Özeti Description alanına ekle (Eğer daha önce özet varsa üstüne yazılır veya altına eklenir)
    // Önceki AI Özetini temizle
    const cleanDescription = (doc.description || '').split('🤖 **AI DOSYA ANALİZİ**')[0].trim();
    
    const newDescription = (cleanDescription ? cleanDescription + '\\n\\n---\\n\\n' : '') + "🤖 **AI DOSYA ANALİZİ**\\n\\n" + summaryText;

    const { error: updateError } = await supabase
      .from('documents')
      .update({ description: newDescription } as any)
      .eq('id', documentId);

    if (updateError) {
      return NextResponse.json({ error: 'Özet veritabanına kaydedilemedi.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, summary: summaryText });

  } catch (error: any) {
    console.error('Summarize API Error:', error);
    return NextResponse.json({ error: 'Bilinmeyen bir hata oluştu: ' + error.message }, { status: 500 });
  }
}
