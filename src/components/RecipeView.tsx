import React, { useState } from 'react';
import { 
  ChefHat, 
  Sparkles, 
  Clock, 
  Users, 
  ShoppingCart, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Plus, 
  Search, 
  Filter, 
  Bookmark, 
  Flame, 
  ArrowRight,
  BookOpen,
  X,
  Loader2,
  PlusCircle
} from 'lucide-react';
import { Recipe, PantryItem } from '../types';
import { UploadRecipeModal } from './UploadRecipeModal';

interface RecipeViewProps {
  recipes: Recipe[];
  pantry: PantryItem[];
  onScheduleMeal: (recipe: Recipe) => void;
  onAddMissingToShoppingList: (missingIngredients: { name: string; amount: string }[], recipeTitle: string) => void;
  onSaveNewAiRecipes: (newRecipes: Recipe[]) => void;
}

export const RecipeView: React.FC<RecipeViewProps> = ({
  recipes,
  pantry,
  onScheduleMeal,
  onAddMissingToShoppingList,
  onSaveNewAiRecipes,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [servingsMultiplier, setServingsMultiplier] = useState<number>(1);

  // AI Recipe Generator state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [dietaryPref, setDietaryPref] = useState<string>('');
  const [maxPrepTime, setMaxPrepTime] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);

  // Calculate pantry match for a recipe
  // Words too generic/common to count as a meaningful match on their own
  // (e.g. "fresh chicken" vs "frozen chicken" should still match on "chicken").
  const DESCRIPTOR_WORDS = new Set([
    'fresh', 'frozen', 'organic', 'boneless', 'skinless', 'large', 'small',
    'medium', 'whole', 'ground', 'chopped', 'diced', 'sliced', 'shredded',
    'minced', 'raw', 'cooked', 'ripe', 'lean', 'extra', 'reduced', 'fat',
    'low', 'fine', 'coarse', 'crushed', 'dried', 'canned', 'jarred',
    'of', 'and', 'the', 'a', 'an', 'to', 'taste', 'optional', 'for'
  ]);

  const significantWords = (str: string): Set<string> =>
    new Set(
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !DESCRIPTOR_WORDS.has(w))
    );

  // Two item names "match" if either fully contains the other (handles exact/close
  // phrasing), OR if they share at least one meaningful word in common (handles
  // real-world cases like "chicken thighs" vs "chicken breast", or branded product
  // names like "Sargento Shredded Mexican Blend Cheese" vs a recipe's "cheddar cheese").
  const namesMatch = (pantryName: string, ingredientName: string): boolean => {
    const pLower = pantryName.toLowerCase();
    const iLower = ingredientName.toLowerCase();
    if (pLower.includes(iLower) || iLower.includes(pLower)) return true;

    const pWords = significantWords(pantryName);
    const iWords = significantWords(ingredientName);
    for (const word of iWords) {
      if (pWords.has(word)) return true;
    }
    return false;
  };

  const getPantryMatchInfo = (recipe: Recipe) => {
    const inStockNames = pantry
      .filter(p => p.status === 'in_stock' || p.status === 'running_low')
      .map(p => p.name);

    const recipeIngredients = recipe.ingredients || [];

    let matchCount = 0;
    const missing: { name: string; amount: string }[] = [];

    recipeIngredients.forEach(ing => {
      const hasItem = inStockNames.some(pName => namesMatch(pName, ing.name || ''));
      if (hasItem) {
        matchCount++;
      } else {
        missing.push({ name: ing.name, amount: ing.amount });
      }
    });

    const total = recipeIngredients.length;
    const matchPercentage = total > 0 ? Math.round((matchCount / total) * 100) : 100;

    return {
      matchCount,
      total,
      matchPercentage,
      missing
    };
  };

  // Filter recipes
  const filteredRecipes = recipes
    .filter(r => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        (selectedCategory === 'AI Generated' ? r.source === 'AI Generated' : r.category === selectedCategory);
      const title = r.title || '';
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (r.tags || []).some(t => (t || '').toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    })
    // Highest pantry match first; ties broken alphabetically so the order stays stable
    .sort((a, b) => {
      const diff = getPantryMatchInfo(b).matchPercentage - getPantryMatchInfo(a).matchPercentage;
      return diff !== 0 ? diff : (a.title || '').localeCompare(b.title || '');
    });

  // Call backend API `/api/gemini/recipe-finder`
  const handleGenerateAiRecipes = async () => {
    setIsGenerating(true);
    setAiError(null);

    const availablePantryNames = pantry
      .filter(p => p.status === 'in_stock' || p.status === 'running_low')
      .map(p => `${p.name} (${p.quantity} ${p.unit})`);

    try {
      const res = await fetch('/api/gemini/recipe-finder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: availablePantryNames,
          dietary: dietaryPref,
          prepTimeLimit: maxPrepTime,
          customPrompt: customPrompt
        })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate recipes');
      }

      // Convert generated recipes to our Recipe format
      const generatedList: Recipe[] = data.recipes.map((r: any, index: number) => ({
        id: `ai-rec-${Date.now()}-${index}`,
        title: r.title,
        description: r.description,
        prepTime: r.prepTime || 15,
        cookTime: r.cookTime || 20,
        servings: r.servings || 4,
        category: r.category || 'AI Recommendation',
        difficulty: r.difficulty || 'Easy',
        tags: r.tags || ['AI Generated', 'Pantry Matched'],
        calories: r.calories || 450,
        source: 'AI Generated',
        ingredients: r.ingredients || [],
        instructions: r.instructions || []
      }));

      onSaveNewAiRecipes(generatedList);
      setShowAiModal(false);
      setIsGenerating(false);
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'An error occurred while calling AI recipe finder.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Hero Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-violet-700 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ChefHat className="w-6 h-6 text-amber-200" />
            <h2 className="text-xl font-extrabold tracking-tight">Recipe Center & Pantry Matcher</h2>
          </div>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
            Find tasty meal ideas based on available pantry ingredients. Missing something? Add needed items directly to your family shopping list with one click!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-white/15 hover:bg-white/25 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center space-x-2 whitespace-nowrap backdrop-blur border border-white/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Upload My Own Recipe</span>
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="bg-white text-amber-900 hover:bg-amber-50 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center space-x-2 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>Find Recipes from Pantry (AI)</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search recipes, ingredients, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
          {['ALL', 'Mexican', 'Italian', 'Seafood', 'Pizza', 'AI Generated'].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Recipes' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecipes.map(recipe => {
          const matchInfo = getPantryMatchInfo(recipe);
          const isHighMatch = matchInfo.matchPercentage >= 80;

          return (
            <div
              key={recipe.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3">
                {/* Header Tags & Match Badge */}
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                    {recipe.category}
                  </span>

                  {/* Pantry Match Badge */}
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 border ${
                    isHighMatch
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300'
                  }`}>
                    {isHighMatch ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-amber-500" />}
                    <span>{matchInfo.matchPercentage}% Pantry Match</span>
                  </span>
                </div>

                {/* Recipe Title & Description */}
                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-lg leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {recipe.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                    {recipe.description}
                  </p>
                </div>

                {/* Recipe Meta Info */}
                <div className="flex items-center space-x-4 text-xs font-semibold text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {recipe.prepTime + recipe.cookTime} mins
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    {recipe.servings} Servings
                  </span>
                  {recipe.calories && (
                    <span className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-500" />
                      {recipe.calories} kcal
                    </span>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 pt-1">
                  {(recipe.tags || []).map(tag => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>

                {/* Missing Ingredients Alert Box */}
                {matchInfo.missing.length > 0 ? (
                  <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 p-3 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
                      <span>Missing {matchInfo.missing.length} ingredient{matchInfo.missing.length > 1 ? 's' : ''}:</span>
                      <button
                        onClick={() => onAddMissingToShoppingList(matchInfo.missing, recipe.title)}
                        className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <ShoppingCart className="w-3 h-3" /> + Add to Shopping List
                      </button>
                    </div>
                    <p className="text-[11px] text-amber-800/80 dark:text-amber-200/80 truncate">
                      {matchInfo.missing.map(m => m.name).join(', ')}
                    </p>
                  </div>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2.5 rounded-xl flex items-center space-x-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>All ingredients currently in pantry!</span>
                  </div>
                )}

              </div>

              {/* Action Footer */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedRecipe(recipe);
                    setServingsMultiplier(1);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <BookOpen className="w-3.5 h-3.5" /> View Recipe
                </button>

                <button
                  onClick={() => onScheduleMeal(recipe)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5" /> Plan for Dinner
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* RECIPE DETAIL MODAL */}
      {selectedRecipe && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 relative">
            
            <button
              onClick={() => setSelectedRecipe(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                {selectedRecipe.category}
              </span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {selectedRecipe.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {selectedRecipe.description}
              </p>
            </div>

            {/* Serving scaler */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <Users className="w-4 h-4 text-amber-500" /> Servings Scaler:
              </span>
              <div className="flex items-center space-x-1 text-xs font-bold">
                {[1, 2, 3].map(factor => (
                  <button
                    key={factor}
                    onClick={() => setServingsMultiplier(factor)}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      servingsMultiplier === factor
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                    }`}
                  >
                    {factor * selectedRecipe.servings} Servings ({factor}x)
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients Checklist */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Ingredients</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(selectedRecipe.ingredients || []).map((ing, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{ing.name}</span>
                    <span className="text-slate-500 font-medium">{ing.amount}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div className="space-y-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Step-by-Step Instructions</h3>
              <ol className="space-y-2.5">
                {(selectedRecipe.instructions || []).map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-3 text-xs text-slate-700 dark:text-slate-300">
                    <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <p className="pt-0.5 leading-relaxed">{step}</p>
                  </li>
                ))}
              </ol>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => {
                  onScheduleMeal(selectedRecipe);
                  setSelectedRecipe(null);
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm"
              >
                Schedule on Family Calendar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* AI RECIPE FINDER MODAL */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
            <button
              onClick={() => setShowAiModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-rose-600">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Pantry Recipe Finder</h3>
              </div>
              <p className="text-xs text-slate-500">
                Our Gemini AI chef will match ingredients from your pantry to craft creative family recipes.
              </p>
            </div>

            {aiError && (
              <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200">
                {aiError}
              </div>
            )}

            <div className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Dietary Preference / Restrictions:
                </label>
                <input
                  type="text"
                  placeholder="e.g., Kid-Friendly, Low-Carb, Vegetarian, Gluten-Free"
                  value={dietaryPref}
                  onChange={(e) => setDietaryPref(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Max Prep Time Limit:
                </label>
                <select
                  value={maxPrepTime}
                  onChange={(e) => setMaxPrepTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                >
                  <option value="">Any time limit</option>
                  <option value="15">Quick (under 15 mins)</option>
                  <option value="30">Under 30 mins</option>
                  <option value="45">Under 45 mins</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Specific Craving or Request (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g., Comforting pasta, crispy chicken dinner, light soup"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateAiRecipes}
                disabled={isGenerating}
                className="px-5 py-2 bg-gradient-to-r from-rose-500 to-amber-600 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center space-x-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is Cooking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate AI Recipes</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {showUploadModal && (
        <UploadRecipeModal
          onClose={() => setShowUploadModal(false)}
          onSaveRecipe={(recipe) => onSaveNewAiRecipes([recipe])}
        />
      )}

    </div>
  );
};

