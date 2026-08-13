import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Plus, 
  Trash2, 
  Loader2, 
  ChefHat, 
  FileText, 
  Image as ImageIcon, 
  Check, 
  Clock, 
  Users, 
  BookOpen 
} from 'lucide-react';
import { Recipe, RecipeIngredient } from '../types';

interface UploadRecipeModalProps {
  recipeToEdit?: Recipe | null;
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
}

export const UploadRecipeModal: React.FC<UploadRecipeModalProps> = ({
  recipeToEdit,
  onClose,
  onSaveRecipe,
}) => {
  const [activeMode, setActiveMode] = useState<'ai_scan' | 'manual'>(
    recipeToEdit ? 'manual' : 'ai_scan'
  );

  // AI Extraction state
  const [pastedText, setPastedText] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State for Recipe
  const [title, setTitle] = useState(recipeToEdit?.title || '');
  const [description, setDescription] = useState(recipeToEdit?.description || '');
  const [category, setCategory] = useState(recipeToEdit?.category || 'Family Favorite');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(
    recipeToEdit?.difficulty || 'Easy'
  );
  const [prepTime, setPrepTime] = useState<number>(recipeToEdit?.prepTime || 15);
  const [cookTime, setCookTime] = useState<number>(recipeToEdit?.cookTime || 20);
  const [servings, setServings] = useState<number>(recipeToEdit?.servings || 4);
  const [calories, setCalories] = useState<number | undefined>(recipeToEdit?.calories || 450);
  const [tagsInput, setTagsInput] = useState<string>(
    recipeToEdit?.tags ? recipeToEdit.tags.join(', ') : 'Family Favorite, Custom'
  );

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    recipeToEdit?.ingredients && recipeToEdit.ingredients.length > 0
      ? recipeToEdit.ingredients
      : [
          { name: '', amount: '' },
          { name: '', amount: '' }
        ]
  );

  const [instructions, setInstructions] = useState<string[]>(
    recipeToEdit?.instructions && recipeToEdit.instructions.length > 0
      ? recipeToEdit.instructions
      : ['', '']
  );

  // File select handler for AI scan
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Convert File to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:image/...;base64, header
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // Call Gemini AI recipe parser
  const handleScanRecipeWithAi = async () => {
    if (!pastedText.trim() && !selectedImageFile) {
      setScanError('Please upload a recipe photo or paste recipe text/notes.');
      return;
    }

    setIsScanning(true);
    setScanError(null);

    try {
      let imageBase64: string | undefined = undefined;
      let mimeType: string | undefined = undefined;

      if (selectedImageFile) {
        imageBase64 = await fileToBase64(selectedImageFile);
        mimeType = selectedImageFile.type || 'image/jpeg';
      }

      const res = await fetch('/api/gemini/parse-recipe-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: pastedText,
          imageBase64,
          mimeType
        })
      });

      const rawResponseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawResponseText);
      } catch {
        throw new Error(
          `Server returned a non-JSON response (status ${res.status}). ` +
          `First 200 chars: ${rawResponseText.slice(0, 200) || '(empty response)'}`
        );
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to parse recipe from input');
      }

      const parsed: Recipe = data.recipe;

      // Fill form state with parsed details so user can verify and save
      setTitle(parsed.title || 'My Custom Recipe');
      setDescription(parsed.description || 'Uploaded family recipe');
      setCategory(parsed.category || 'Family Favorite');
      setDifficulty(parsed.difficulty || 'Easy');
      setPrepTime(parsed.prepTime || 15);
      setCookTime(parsed.cookTime || 20);
      setServings(parsed.servings || 4);
      setCalories(parsed.calories || 400);
      if (parsed.tags && parsed.tags.length > 0) {
        setTagsInput(parsed.tags.join(', '));
      }

      if (parsed.ingredients && parsed.ingredients.length > 0) {
        setIngredients(parsed.ingredients.map(i => ({ name: i.name, amount: i.amount })));
      }

      if (parsed.instructions && parsed.instructions.length > 0) {
        setInstructions(parsed.instructions);
      }

      // Switch to manual mode for review
      setActiveMode('manual');
      setIsScanning(false);
    } catch (err: any) {
      console.error(err);
      setScanError(err.message || 'Error parsing recipe. Please try manual entry.');
      setIsScanning(false);
    }
  };

  // Ingredients list helpers
  const handleAddIngredientRow = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const handleUpdateIngredient = (index: number, field: 'name' | 'amount', value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  // Instructions helpers
  const handleAddInstructionRow = () => {
    setInstructions([...instructions, '']);
  };

  const handleUpdateInstruction = (index: number, value: string) => {
    const updated = [...instructions];
    updated[index] = value;
    setInstructions(updated);
  };

  const handleRemoveInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  // Save Recipe Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Please enter a recipe title.');
      return;
    }

    const cleanIngredients = ingredients.filter(i => i.name.trim().length > 0);
    if (cleanIngredients.length === 0) {
      alert('Please add at least one ingredient.');
      return;
    }

    const cleanInstructions = instructions.filter(i => i.trim().length > 0);

    const parsedTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const finalRecipe: Recipe = {
      id: recipeToEdit ? recipeToEdit.id : `rec-user-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || 'Custom family recipe',
      category: category.trim() || 'Family Favorite',
      difficulty,
      prepTime: Number(prepTime) || 15,
      cookTime: Number(cookTime) || 15,
      servings: Number(servings) || 4,
      calories: calories ? Number(calories) : undefined,
      source: recipeToEdit?.source || 'Family Favorite',
      tags: parsedTags.length > 0 ? parsedTags : ['Family Favorite', 'Uploaded'],
      ingredients: cleanIngredients,
      instructions: cleanInstructions.length > 0 ? cleanInstructions : ['Enjoy your meal!']
    };

    onSaveRecipe(finalRecipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-5 sm:p-6 space-y-5 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-300">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                {recipeToEdit ? 'Edit Recipe' : 'Upload & Add Custom Recipe'}
              </h2>
              <p className="text-xs text-slate-500">
                {recipeToEdit ? 'Update recipe details and ingredient matching' : 'Add your family recipes or scan recipe cards with AI'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full bg-slate-100 dark:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        {!recipeToEdit && (
          <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveMode('ai_scan')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
                activeMode === 'ai_scan'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span>AI Photo / Document Scan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMode('manual')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center space-x-2 ${
                activeMode === 'manual'
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4 text-amber-500" />
              <span>Manual Recipe Form</span>
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto pr-1 space-y-5 flex-1">
          
          {/* AI SCAN MODE */}
          {activeMode === 'ai_scan' && (
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-amber-50 to-rose-50 dark:from-amber-950/40 dark:to-rose-950/40 rounded-2xl border border-amber-200/80 dark:border-amber-900/60 space-y-1">
                <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-500" /> AI Recipe Digitizer
                </span>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                  Snap or upload a photo of a handwritten recipe card, cookbook page, screenshot, or paste raw text or link below!
                </p>
              </div>

              {scanError && (
                <div className="p-3 bg-rose-50 text-rose-800 rounded-xl text-xs font-semibold border border-rose-200">
                  {scanError}
                </div>
              )}

              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Upload Recipe Photo or Document:
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/50 flex flex-col items-center justify-center space-y-2"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,.pdf"
                    className="hidden"
                  />
                  {imagePreviewUrl ? (
                    <div className="relative w-full max-h-48 overflow-hidden rounded-xl flex justify-center">
                      <img src={imagePreviewUrl} alt="Recipe Preview" className="max-h-48 object-contain rounded-xl" />
                    </div>
                  ) : (
                    <>
                      <div className="p-3 bg-amber-100 dark:bg-amber-950 rounded-2xl text-amber-600">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Click to select or drop recipe photo/screenshot
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Supports PNG, JPG, WEBP recipe cards & cookbooks
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Text / Notes Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Or Paste Recipe Text / Link / Notes:
                </label>
                <textarea
                  rows={4}
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste ingredients and instructions here (e.g., Grandma's Apple Pie: 3 apples, 1 cup flour, bake at 350 for 40 mins...)"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action button */}
              <button
                type="button"
                onClick={handleScanRecipeWithAi}
                disabled={isScanning}
                className="w-full py-3 bg-gradient-to-r from-amber-600 via-rose-600 to-violet-600 text-white rounded-2xl text-xs font-extrabold shadow-sm hover:opacity-95 transition-all flex items-center justify-center space-x-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Gemini AI is Extracting Recipe...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Scan & Digitize Recipe with AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* MANUAL FORM MODE */}
          {(activeMode === 'manual' || recipeToEdit) && (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Recipe Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Grandma's Famous Lasagna"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Family Favorite, Pasta"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="e.g., A rich, layered family favorite passed down for generations."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Prep / Cook Time / Servings / Difficulty */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Prep Time (m)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={prepTime}
                    onChange={(e) => setPrepTime(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Cook Time (m)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={cookTime}
                    onChange={(e) => setCookTime(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Servings
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => setServings(Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1">
                    Ingredients List *
                    <span className="text-[11px] font-medium text-slate-400">(matched automatically against pantry)</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> <span>Add Ingredient</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Ingredient Name (e.g. Ground Beef)"
                        value={ing.name}
                        onChange={(e) => handleUpdateIngredient(idx, 'name', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <input
                        type="text"
                        placeholder="Amount (e.g. 1.5 lbs)"
                        value={ing.amount}
                        onChange={(e) => handleUpdateIngredient(idx, 'amount', e.target.value)}
                        className="w-28 sm:w-32 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      {ingredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white">
                    Step-by-Step Instructions
                  </label>
                  <button
                    type="button"
                    onClick={handleAddInstructionRow}
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> <span>Add Step</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {instructions.map((step, idx) => (
                    <div key={idx} className="flex items-start space-x-2">
                      <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-1">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={1}
                        placeholder={`Step ${idx + 1} instructions...`}
                        value={step}
                        onChange={(e) => handleUpdateInstruction(idx, e.target.value)}
                        className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      {instructions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveInstruction(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors mt-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="Family Favorite, Kid Friendly, Quick <30m, Low Carb"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Recipe to Book</span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};

