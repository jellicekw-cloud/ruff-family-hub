import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Type } from "@google/genai";
import { ai } from "../_lib/gemini.js";

// Common main-protein keywords. If a recipe's ingredient list contains one of these
// and the user's actual pantry doesn't contain that same protein (or a close relative),
// the recipe gets rejected — regardless of what the AI claims. This is a hard guardrail
// on top of the prompt instructions, since LLMs don't always follow soft rules reliably.
const PROTEIN_KEYWORDS = [
  'chicken', 'beef', 'pork', 'salmon', 'fish', 'shrimp', 'prawn', 'turkey',
  'lamb', 'tofu', 'bacon', 'sausage', 'ham', 'tilapia', 'cod', 'tuna',
  'crab', 'lobster', 'duck', 'steak', 'ground beef', 'venison'
];

function pantryHasProtein(pantryListLower: string, protein: string): boolean {
  return pantryListLower.includes(protein);
}

function recipeUsesUnavailableProtein(recipeIngredients: any[], pantryListLower: string): string | null {
  for (const ing of recipeIngredients) {
    const nameLower = (ing.name || '').toLowerCase();
    for (const protein of PROTEIN_KEYWORDS) {
      if (nameLower.includes(protein) && !pantryHasProtein(pantryListLower, protein)) {
        return protein;
      }
    }
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const { ingredients, dietary, prepTimeLimit, customPrompt } = req.body || {};

    const availableList = Array.isArray(ingredients) && ingredients.length > 0
      ? ingredients.join(", ")
      : "pasta, tomatoes, garlic, olive oil, eggs, cheese, chicken, rice, onions, butter";
    const availableListLower = availableList.toLowerCase();

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
    const rawRecipes = JSON.parse(jsonText);

    // Hard guardrail: reject any recipe that snuck in a protein not actually in the pantry,
    // regardless of what the prompt asked for. Better to return fewer, correct recipes
    // than 3 recipes where one doesn't belong.
    const recipes = (Array.isArray(rawRecipes) ? rawRecipes : []).filter((recipe: any) => {
      const badProtein = recipeUsesUnavailableProtein(recipe.ingredients || [], availableListLower);
      if (badProtein) {
        console.warn(`Rejected AI recipe "${recipe.title}" — used "${badProtein}" which isn't in the pantry`);
        return false;
      }
      return true;
    });

    return res.json({ success: true, recipes });
  } catch (error: any) {
    console.error("Error in /api/gemini/recipe-finder:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate recipes from pantry"
    });
  }
}

