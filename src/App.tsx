import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();

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
    You are a professional chef and family meal planner helping a family cook with what they already have, to reduce food waste and avoid unnecessary grocery trips.

    The user's pantry currently contains ONLY these ingredients: [${availableList}].
    Dietary restrictions/preferences: ${dietary || "None"}.
    Maximum prep time limit: ${prepTimeLimit ? prepTimeLimit + " minutes" : "Any"}.
    Special request / Craving: ${customPrompt || "Provide tasty, family-friendly recipes"}.

    STRICT RULES — follow these exactly, they are not optional:
    1. Every recipe's MAIN ingredient(s) — the primary protein, primary vegetable, primary starch, etc. — MUST come from the pantry list above. NEVER substitute in a different protein or primary ingredient that isn't listed. For example, if the pantry has chicken but no salmon, do not suggest a salmon recipe — only chicken-based recipes are allowed as the main protein.
    2. You may include small supporting or missing ingredients not in the pantry (a spice, a sauce, a garnish, a common aromatic like garlic or onion) ONLY as minor additions — never as the primary component of a dish.
    3. If the pantry only supports one type of main dish (e.g. only one protein), generate 3 DIFFERENT preparations of that SAME main ingredient (e.g. grilled, stir-fried, baked, or in a soup) rather than inventing an unrelated dish with a different main ingredient.
    4. Prioritize recipes that use the MOST pantry ingredients possible — maximize overlap with the pantry list, minimize how many ingredients are missing.

    Generate 3 distinct, delicious family-friendly recipes following the rules above. For each recipe, clearly mark which ingredients the user already HAS in their pantry (inPantry: true) vs which are missing (inPantry: false) — missing ingredients should only be the minor supporting items allowed under rule 2.
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

// 4. Parse a user's own recipe from a pasted-text note or an uploaded photo/document
app.post("/api/gemini/parse-recipe-upload", async (req, res) => {
  try {
    const { rawText, imageBase64, mimeType } = req.body;
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
});

export default app;

