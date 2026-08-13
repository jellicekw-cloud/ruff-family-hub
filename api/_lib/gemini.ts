import { GoogleGenAI } from "@google/genai";

// Shared Gemini client used by every individual /api/gemini/* Vercel function.
export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

