import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Type } from "@google/genai";
import { ai } from "../_lib/gemini.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { rawText } = req.body || {};
    if (!rawText || typeof rawText !== "string") {
      return res.status(400).json({ success: false, error: "rawText is required" });
    }

    const promptText = `
    Extract grocery items from the following raw note/receipt or list text:
    "${rawText}"

    Convert each item into a structured pantry entry with name, quantity, unit, and appropriate category.
    Valid categories: "Produce", "Dairy & Eggs", "Meat & Seafood", "Pantry & Grains", "Spices & Condiments", "Canned Goods", "Snacks & Drinks", "Frozen", "Bakery".
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              category: { type: Type.STRING },
              notes: { type: Type.STRING }
            },
            required: ["name", "quantity", "unit", "category"]
          }
        }
      }
    });

    const items = JSON.parse(response.text || "[]");
    return res.json({ success: true, items });
  } catch (error: any) {
    console.error("Error in /api/gemini/pantry-parser:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

