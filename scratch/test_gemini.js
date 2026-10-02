import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModels() {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  try {
    const models = await ai.models.list();
    console.log("Available models:");
    for await (const model of models) {
      console.log(model.name);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

listModels();
