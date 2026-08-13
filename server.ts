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
