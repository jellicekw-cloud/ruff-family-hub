import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Type } from "@google/genai";
import { ai } from "../_lib/gemini.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { rawText, imageBase64, mimeType } = req.body || {};

    if (!rawText && !imageBase64) {
      return res.status(400).json({ success: false, error: "Either rawText or imageBase64 is required" });
    }

    const contents: any[] = [];
    const systemPrompt = "You are an expert culinary assistant. Analyze the provided recipe photo or text and extract a structured recipe format matching the schema. Estimate reasonable prep time, cook time, servings, and calories if not explicitly stated. Clean up ingredient names cleanly (e.g. name: 'Ground Beef', amount: '1 lb').";

    if (imageBase64) {
      contents.push({
        inlineData: {
          mimeType: mimeType || "image/jpeg",
          data: imageBase64
        }
      });
      contents.push({
        text: `Extract the recipe details from this uploaded photo/document. Additional user context: ${rawText || "None"}`
      });
    } else {
      contents.push({
        text: `Extract the recipe details from the following raw text or recipe input:\n\n"${rawText}"`
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            prepTime: { type: Type.INTEGER },
            cookTime: { type: Type.INTEGER },
            servings: { type: Type.INTEGER },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            calories: { type: Type.INTEGER },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  amount: { type: Type.STRING }
                },
                required: ["name", "amount"]
              }
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["title", "description", "prepTime", "cookTime", "servings", "category", "difficulty", "ingredients", "instructions"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const recipe = JSON.parse(jsonText);
    return res.json({ success: true, recipe });
  } catch (error: any) {
    console.error("Error in /api/gemini/parse-recipe-upload:", error);
    return res.status(500).json({ success: false, error: error.message || "Failed to parse uploaded recipe" });
  }
}

