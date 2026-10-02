import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  try {
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not found in Vercel env' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const models = await ai.models.list();
    
    const availableModels = [];
    for await (const model of models) {
      availableModels.push(model.name);
    }

    return NextResponse.json({ success: true, models: availableModels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
