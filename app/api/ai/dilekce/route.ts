import { NextResponse } from 'next/server'
import { generateWithFallback } from '@/lib/ai-providers'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { client, type, explanations, precedents } = body


    let clientInfoStr = ''
    if (client) {
      clientInfoStr = `MÜVEKKİL BİLGİLERİ:\nAd Soyad/Unvan: ${client.full_name}\nTC/VKN: ${client.tc_tax_number || 'Belirtilmedi'}\nAdres: ${client.address || 'Belirtilmedi'}\nTelefon: ${client.phone || 'Belirtilmedi'}\n`
    } else {
      clientInfoStr = 'MÜVEKKİL BİLGİLERİ: (Belirtilmedi, boşluk bırakılacak)'
    }

    const systemPrompt = `Sen Türkiye'nin en tecrübeli 30 yıllık Avukatısın ve Kusursuz Dilekçe yazıyorsun.
Görev: Kullanıcının verdiği bilgilere ve seçtiği dilekçe türüne uygun, doğrudan UYAP ortamında mahkemeye sunulacak resmi, ciddi ve hukuki terimlerin doğru kullanıldığı bir dilekçe metni (taslağı) üretmektir.

KURALLAR:
1. Sadece dilekçe metnini ver, "İşte dilekçeniz", "Merhaba" gibi sohbet kelimeleri ASLA KULLANMA.
2. Metin UYAP Editör'e (XML'e) aktarılacağı için Markdown kalın/italik (** veya #) işaretlerini KESİNLİKLE KULLANMA! Düz metin kullan.
3. BAŞLIK kısımlarını BÜYÜK HARFLE ve ortalanmış hissi verecek şekilde düz yaz (örneğin: NÖBETÇİ ASLİYE HUKUK MAHKEMESİNE).
4. İlgili emsal kararlar (içtihatlar) verilmişse, bunları metnin ilgili yerine "Yargıtay X. Dairesinin Yılı/Esası" şeklinde atıf yaparak yedir.
5. Müvekkil bilgileri verilmişse, davacı/davalı kısımlarına yerleştir.
6. Sonuç ve İstem kısmını kesin, net ve hukuki bir dille yaz.`

    const prompt = `DİLEKÇE TÜRÜ: ${type}
${clientInfoStr}

OLAY ÖRGÜSÜ VE AÇIKLAMALAR:
${explanations}

EKLENMESİ İSTENEN EMSAL KARARLAR/İÇTİHATLAR:
${precedents || 'Yok'}

Lütfen yukarıdaki bilgilere göre eksiksiz bir dilekçe metni oluştur. (Sadece metin, markdown işaretleri olmadan)`

    const { result, errors } = await generateWithFallback(`${systemPrompt}\n\n${prompt}`, {
      temperature: 0.2 // Dilekçe ciddi ve formatlı olmalı
    })

    if (!result) {
      throw new Error('Hiçbir yapay zeka servisine ulaşılamadı: ' + errors.join(' | '))
    }

    return NextResponse.json({
      success: true,
      text: result.text.trim(),
      provider: result.provider
    })

  } catch (error: any) {
    console.error('Dilekçe AI Hatası:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Dilekçe oluşturulurken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
