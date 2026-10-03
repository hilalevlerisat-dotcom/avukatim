import { NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { client, type, explanations, precedents } = body

    const geminiKey = process.env.GEMINI_API_KEY
    if (!geminiKey) {
      return NextResponse.json({ success: false, message: 'Yapay zeka API anahtarı eksik.' }, { status: 500 })
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey })
    const model = 'gemini-3.8-flash'

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

    const genResponse = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${prompt}` }]
        }
      ],
      config: {
        temperature: 0.2 // Dilekçe ciddi ve formatlı olmalı
      }
    })

    if (!genResponse.text) {
      throw new Error('AI boş yanıt döndürdü.')
    }

    return NextResponse.json({
      success: true,
      text: genResponse.text.trim()
    })

  } catch (error: any) {
    console.error('Dilekçe AI Hatası:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Dilekçe oluşturulurken bir hata oluştu.' },
      { status: 500 }
    )
  }
}
