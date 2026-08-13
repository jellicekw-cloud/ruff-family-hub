import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize GoogleGenAI SDK server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 1. Find or Generate Recipes based on Pantry Ingredients
app.post("/api/gemini/recipe-finder", async (req, res) => {
  try {
    const { ingredients, dietary, prepTimeLimit, customPrompt } = req.body;

    const availableList = Array.isArray(ingredients) && ingredients.length > 0
      ? ingredients.join(", ")
      : "pasta, tomatoes, garlic, olive oil, eggs, cheese, chicken, rice, onions, butter";

    const promptText = `
    You are a professional chef and family meal planner. 
    The user has the following ingredients available in their pantry: [${availableList}].
    Dietary restrictions/preferences: ${dietary || "None"}.
    Maximum prep time limit: ${prepTimeLimit ? prepTimeLimit + " minutes" : "Any"}.
    Special request / Craving: ${customPrompt || "Provide tasty, family-friendly recipes"}.

    Generate 3 distinct, delicious family-friendly recipes that utilize as many available pantry ingredients as possible.
    For each recipe, clearly distinguish ingredients that the user HAS in their pantry vs ingredients they might still NEED (missing ingredients).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: promptText,
      config: {
        systemInstruction: "You generate realistic, delicious family recipes formatted precisely according to the requested JSON schema.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          description: "List of 3 generated recipes",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              prepTime: { type: Type.INTEGER, description: "Prep time in minutes" },
              cookTime: { type: Type.INTEGER, description: "Cook time in minutes" },
              servings: { type: Type.INTEGER },
              category: { type: Type.STRING, description: "e.g., Pasta, Chicken, Breakfast, Vegetarian" },
              difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" },
              tags: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    amount: { type: Type.STRING },
                    inPantry: { type: Type.BOOLEAN, description: "true if user has this ingredient in pantry list, false if missing" }
                  },
                  required: ["name", "amount", "inPantry"]
                }
              },
              instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              calories: { type: Type.INTEGER }
            },
            required: ["title", "description", "prepTime", "cookTime", "servings", "category", "difficulty", "ingredients", "instructions"]
          }
        }
      }
    });

    const jsonText = response.text || "[]";
    const recipes = JSON.parse(jsonText);
    return res.json({ success: true, recipes });
  } catch (error: any) {
    console.error("Error in /api/gemini/recipe-finder:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to generate recipes from pantry" 
    });
  }
});

// 2. Parse text or receipt into structured Pantry items
app.post("/api/gemini/pantry-parser", async (req, res) => {
  try {
    const { rawText } = req.body;
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
});

// 3. AI Smart Meal Plan based on Calendar Events and Pantry
app.post("/api/gemini/smart-meal-plan", async (req, res) => {
  try {
    const { events, pantryItems } = req.body;

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
});

// Strips a webpage down to readable text so it can be handed to Gemini without
// wasting tokens on scripts, styles, and markup noise.
function extractReadableTextFromHtml(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<\/(p|div|li|tr|br|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();

  // Cap length so we don't blow the prompt budget on huge pages full of unrelated content
  return text.slice(0, 18000);
}

// 4. Parse a user's own recipe from pasted text, an uploaded photo/file, or a recipe website URL
app.post("/api/gemini/recipe-parser", async (req, res) => {
  try {
    const { rawText, imageBase64, imageMimeType, url } = req.body;

    if (!rawText && !imageBase64 && !url) {
      return res.status(400).json({ success: false, error: "Provide rawText, imageBase64, or url" });
    }

    let resolvedText = rawText;

    if (url) {
      try {
        const pageRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RuffFamilyHub/1.0)' }
        });
        if (!pageRes.ok) {
          return res.status(400).json({ success: false, error: `Couldn't load that page (status ${pageRes.status}). Try pasting the recipe text instead.` });
        }
        const html = await pageRes.text();
        resolvedText = extractReadableTextFromHtml(html);
        if (!resolvedText || resolvedText.length < 40) {
          return res.status(400).json({ success: false, error: "Couldn't find readable recipe content on that page. Try pasting the recipe text instead." });
        }
      } catch (fetchErr: any) {
        console.error("Error fetching recipe URL:", fetchErr);
        return res.status(400).json({ success: false, error: "Couldn't reach that URL. Check the link and try again, or paste the recipe text instead." });
      }
    }

    const instruction = `
    Extract a single recipe from the provided ${imageBase64 ? "photo" : url ? "webpage content" : "text"} (could be a handwritten card, a screenshot, a pasted note, or a recipe website).
    Return one structured recipe with a title, short description, prep/cook time in minutes, servings, category (e.g. Mexican, Italian, Breakfast, Vegetarian), difficulty (Easy/Medium/Hard), helpful tags, estimated calories per serving, a full ingredient list (name + amount, e.g. "2 cups" or "1 lb"), and clear numbered step-by-step instructions.
    If information is missing or illegible, make a reasonable, realistic estimate rather than leaving fields blank.
    Ignore unrelated webpage content like ads, comments, navigation links, or other article recommendations — focus only on the actual recipe.
    `;

    const contentParts: any[] = [{ text: instruction }];
    if (imageBase64) {
      contentParts.push({
        inlineData: {
          data: imageBase64,
          mimeType: imageMimeType || "image/jpeg"
        }
      });
    } else {
      contentParts.push({ text: `Recipe content:\n"""\n${resolvedText}\n"""` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: [{ role: "user", parts: contentParts }],
      config: {
        systemInstruction: "You extract real, usable recipes into precise structured JSON matching the requested schema exactly. Never include markdown or commentary outside the JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            prepTime: { type: Type.INTEGER, description: "Prep time in minutes" },
            cookTime: { type: Type.INTEGER, description: "Cook time in minutes" },
            servings: { type: Type.INTEGER },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING, description: "Easy, Medium, or Hard" },
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
    console.error("Error in /api/gemini/recipe-parser:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to parse recipe"
    });
  }
});

// Serve frontend in production or Vite middleware in dev
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

