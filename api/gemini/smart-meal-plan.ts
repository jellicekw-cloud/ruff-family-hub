import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Type } from "@google/genai";
import { ai } from "../_lib/gemini.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { events, pantryItems } = req.body || {};

    const promptText = `
    Given the following upcoming family events:
    ${JSON.stringify(events || [])}

    And current pantry stock:
    ${JSON.stringify(pantryItems || [])}

    Suggest a 5-day dinner meal plan taking into account busy days (e.g., sports, late work = fast easy dinners) and using available pantry items.
    Return an array of meal suggestions with dayName, suggestedMealTitle, rationale, prepMinutes, and keyIngredients.
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
              dayName: { type: Type.STRING },
              suggestedMealTitle: { type: Type.STRING },
              rationale: { type: Type.STRING },
              prepMinutes: { type: Type.INTEGER },
              keyIngredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["dayName", "suggestedMealTitle", "rationale", "prepMinutes", "keyIngredients"]
          }
        }
      }
    });

    const plan = JSON.parse(response.text || "[]");
    return res.json({ success: true, plan });
  } catch (error: any) {
    console.error("Error in /api/gemini/smart-meal-plan:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}

