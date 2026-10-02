import { GoogleGenAI } from '@google/genai';

/**
 * Gemini text-embedding-004 kullanarak metinden 768 boyutlu vektör embedding üretir.
 */
export async function generateEmbedding(text: string): Promise<number[] | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) {
    console.warn('GEMINI_API_KEY bulunamadı, embedding üretilemedi.');
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    
    // Metni makul bir uzunlukla sınırla
    const cleanText = text.replace(/\s+/g, ' ').trim().slice(0, 4000);

    const response = await ai.models.embedContent({
      model: 'text-embedding-004',
      contents: cleanText,
    });

    const values = response.embedding?.values || response.embeddings?.[0]?.values;
    if (values && Array.isArray(values) && values.length === 768) {
      return values;
    }

    console.warn('Embedding yanıtı beklenen 768 boyutta değil:', values?.length);
    return values || null;
  } catch (error: any) {
    console.error('Gemini Embedding Hatası:', error?.message || error);
    return null;
  }
}
