import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateEmbedding } from '@/lib/gemini-embedding';
import { GoogleGenAI } from '@google/genai';

const HUGGINGFACE_API = 'https://datasets-server.huggingface.co/rows';
const DATASET = 'mrfg/turkish-court-decisions';

// Aranacak hukuki konular / daireler
const SMART_QUERIES = [
  { config: 'yargitay', filter: 'Hukuk Genel Kurulu', desc: 'HGK Kararları' },
  { config: 'yargitay', filter: '9. Hukuk Dairesi', desc: 'İş Hukuku (9. HD)' },
  { config: 'yargitay', filter: '2. Hukuk Dairesi', desc: 'Aile Hukuku (2. HD)' },
  { config: 'yargitay', filter: '3. Hukuk Dairesi', desc: 'Kira Hukuku (3. HD)' },
  { config: 'yargitay', filter: '4. Hukuk Dairesi', desc: 'Tazminat (4. HD)' },
  { config: 'yargitay', filter: '11. Hukuk Dairesi', desc: 'Ticaret Hukuku (11. HD)' },
  { config: 'yargitay', filter: '12. Hukuk Dairesi', desc: 'İcra Hukuku (12. HD)' },
  { config: 'danistay', filter: null, desc: 'Danıştay Kararları' },
];

/**
 * Karar metninden Gemini ile konu ve özet çıkar
 */
async function extractSummary(ai: any, text: string, daire: string): Promise<{ konu: string; ozet: string }> {
  try {
    const prompt = `Aşağıdaki Yargıtay/Danıştay kararı metninden sadece şu iki bilgiyi çıkar ve JSON formatında döndür:
{
  "konu": "Maksimum 80 karakter - kararın uyuşmazlık konusu (Örn: Fazla mesai ücreti ödenmemesi ve haklı fesih)",
  "ozet": "2-3 cümle - kararın kabul ettiği hukuki ilke ve gerekçe"
}

Daire: ${daire}
Karar Metni (ilk 2000 karakter):
${text.slice(0, 2000)}

SADECE JSON döndür, başka açıklama yazma.`;

    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { temperature: 0.1 }
    });

    const jsonStr = (res.text || '').replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    return {
      konu: parsed.konu?.slice(0, 150) || `${daire} Kararı`,
      ozet: parsed.ozet?.slice(0, 600) || text.slice(0, 300)
    };
  } catch {
    // Fallback: İlk 300 karakteri özet olarak kullan
    const lines = text.split('\n').filter(l => l.trim().length > 30);
    return {
      konu: `${daire} - Hukuki Uyuşmazlık`,
      ozet: lines.slice(0, 3).join(' ').slice(0, 400) || text.slice(0, 300)
    };
  }
}

/**
 * POST /api/ai/emsal/import
 * HuggingFace açık veri setinden gerçek Yargıtay kararlarını çekip veritabanına aktarır
 * 
 * Body: { 
 *   config?: 'yargitay' | 'danistay' | 'emsal' | 'aym_norm',
 *   limit?: number,          // Kaç karar içe aktarılsın (max 50)
 *   offset?: number,         // Hangi kayıttan başlasın
 *   minYear?: number,        // Minimum yıl filtresi
 *   courtFilter?: string,    // Daire filtresi (kısmi eşleşme)
 *   generateSummaries?: boolean, // Gemini ile konu/özet çıkarsın mı?
 * }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      config = 'yargitay',
      limit = 20,
      offset = 0,
      minYear = 2018,
      courtFilter = null,
      generateSummaries = true
    } = body;

    const actualLimit = Math.min(Number(limit), 50);
    const geminiKey = process.env.GEMINI_API_KEY;

    // HuggingFace Datasets API çağrısı (ücretsiz, API key gerekmez)
    const hfUrl = new URL(HUGGINGFACE_API);
    hfUrl.searchParams.set('dataset', DATASET);
    hfUrl.searchParams.set('config', config);
    hfUrl.searchParams.set('split', 'train');
    hfUrl.searchParams.set('offset', String(offset));
    hfUrl.searchParams.set('length', String(Math.min(actualLimit * 5, 100))); // Daha fazla çek, filtreleyeceğiz (Max 100)

    const hfRes = await fetch(hfUrl.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });

    if (!hfRes.ok) {
      throw new Error(`HuggingFace API hatası: ${hfRes.status} ${hfRes.statusText}`);
    }

    const hfData = await hfRes.json();
    let rows: any[] = hfData.rows?.map((r: any) => r.row) || [];

    // Yıl filtresi uygula
    if (minYear) {
      rows = rows.filter(r => r.year >= minYear);
    }

    // Daire filtresi uygula
    if (courtFilter) {
      rows = rows.filter(r =>
        r.court?.toLowerCase().includes(courtFilter.toLowerCase())
      );
    }

    // İstenen limite sınırla
    rows = rows.slice(0, actualLimit);

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        imported: 0,
        message: 'Belirtilen filtrelere uygun karar bulunamadı. offset veya minYear değerini değiştirmeyi deneyin.',
        totalAvailable: hfData.num_rows_total
      });
    }

    const supabase = await createClient();
    const ai = geminiKey ? new GoogleGenAI({ apiKey: geminiKey }) : null;

    let importedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        // Zaten var mı kontrol et (esas_no ve karar_no ile)
        const { data: existing } = await (supabase
          .from('emsal_kararlar') as any)
          .select('id')
          .eq('esas_no', row.esas_no)
          .eq('karar_no', row.karar_no)
          .maybeSingle();

        if (existing) {
          skippedCount++;
          continue;
        }

        // Daire formatını güzelleştir
        const daire = row.source === 'danistay'
          ? `Danıştay ${row.court || 'İlgili Daire'}`
          : `Yargıtay ${row.court || 'İlgili Daire'}`;

        // Konu ve özet çıkar
        let konu = `${row.court} - Hukuki Uyuşmazlık`;
        let ozet = row.text?.slice(0, 350) || 'Karar özeti mevcut değil.';

        if (ai && generateSummaries && row.text && row.text.length > 200) {
          const extracted = await extractSummary(ai, row.text, daire);
          konu = extracted.konu;
          ozet = extracted.ozet;
        }

        // Embedding oluştur
        let embedding = null;
        if (ai) {
          const textToEmbed = `${daire} ${row.esas_no} ${row.karar_no}. Konu: ${konu}. Özet: ${ozet}`;
          embedding = await generateEmbedding(textToEmbed);
        }

        // Kayıt tarihi formatı
        let kararTarihi: string | null = null;
        if (row.karar_tarihi && /^\d{4}-\d{2}-\d{2}$/.test(row.karar_tarihi)) {
          kararTarihi = row.karar_tarihi;
        }

        const record: any = {
          daire,
          esas_no: row.esas_no || 'Belirtilmedi',
          karar_no: row.karar_no || 'Belirtilmedi',
          karar_tarihi: kararTarihi,
          konu,
          ozet,
          metin: row.text?.slice(0, 8000) || null // Max 8000 karakter saklayalım
        };

        if (embedding) {
          record.embedding = embedding;
        }

        const { error: insertErr } = await (supabase
          .from('emsal_kararlar') as any)
          .insert(record);

        if (insertErr) {
          errors.push(`${row.esas_no}: ${insertErr.message}`);
        } else {
          importedCount++;
        }

        // Rate limiting - Gemini'ye çok hızlı istek atmayalım
        if (ai && generateSummaries) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (rowErr: any) {
        errors.push(`Kayıt hatası: ${rowErr.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.length > 0 ? errors.slice(0, 5) : undefined,
      totalAvailableOnHuggingFace: hfData.num_rows_total,
      message: `${importedCount} adet gerçek ${config === 'danistay' ? 'Danıştay' : 'Yargıtay'} kararı veritabanına aktarıldı${skippedCount > 0 ? `, ${skippedCount} adet zaten mevcuttu` : ''}. HuggingFace'de toplam ${(hfData.num_rows_total || 0).toLocaleString('tr-TR')} karar mevcut.`
    });

  } catch (err: any) {
    console.error('Import API Hatası:', err);
    return NextResponse.json({
      error: 'İçe aktarma sırasında hata oluştu: ' + err.message
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/emsal/import
 * HuggingFace veri setindeki toplam karar sayısını ve önizlemeyi döndürür
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const config = searchParams.get('config') || 'yargitay';

    const hfUrl = `${HUGGINGFACE_API}?dataset=${DATASET}&config=${config}&split=train&offset=0&length=2`;
    const hfRes = await fetch(hfUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10000)
    });

    if (!hfRes.ok) {
      throw new Error(`HuggingFace API hatası: ${hfRes.status}`);
    }

    const data = await hfRes.json();
    const sample = data.rows?.[0]?.row;

    return NextResponse.json({
      success: true,
      source: 'HuggingFace - mrfg/turkish-court-decisions (CC0 Lisans - Kamuya Açık)',
      config,
      totalRecords: data.num_rows_total,
      sampleDecision: sample ? {
        court: sample.court,
        esas_no: sample.esas_no,
        karar_no: sample.karar_no,
        karar_tarihi: sample.karar_tarihi,
        year: sample.year,
        textPreview: sample.text?.slice(0, 200) + '...'
      } : null,
      availableConfigs: ['yargitay (9.8M+)', 'danistay (835K+)', 'emsal (283K+)', 'aym_norm (27K+)', 'aym_bb (81K+)']
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
