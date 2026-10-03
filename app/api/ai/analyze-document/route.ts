import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const { text, filename } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    let aiResult = '';

    if (process.env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Sen uzman bir avukat asistanısın. Aşağıda "${filename || 'dosya'}" isimli evraktan çıkarılan metin var. Lütfen bu metni hukuki bir gözle analiz et. 
      Öncelikle belgenin ne tür bir belge olduğunu kısaca belirt (ör: İddianame, Tensip Zaptı, İhtarname, Dilekçe vb).
      Sonra belgedeki en önemli noktaları maddeler halinde özetle ve avukatın bilmesi/dikkat etmesi gereken kritik hususlar (süreler, eksiklikler, talepler) varsa vurgula.
      
      Metin:
      ${text.substring(0, 30000)} // Limit context size
      `;
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      aiResult = response.text || '';
    } else {
      aiResult = "DEMO MODU: Gemini API anahtarı tanımlı değil. Evrak başarıyla analiz edildi simüle ediliyor...\n\n- Bu belge bir hukuki evraktır.\n- İçeriği başarıyla çıkarılmıştır.\n- Gerçek analiz için .env dosyasına GEMINI_API_KEY ekleyin.";
    }

    return NextResponse.json({ analysis: aiResult });

  } catch (error: any) {
    console.error('AI Document Analysis Error:', error);
    return NextResponse.json({ error: 'AI analizi sırasında bir hata oluştu.' }, { status: 500 });
  }
}
