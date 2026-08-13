import React, { useRef, useState } from 'react';
import { X, Sparkles, Loader2, UploadCloud, FileText, Image as ImageIcon, ChefHat, CheckCircle2, Link as LinkIcon } from 'lucide-react';
import { Recipe } from '../types';

interface AddOwnRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
}

type InputMode = 'paste' | 'file' | 'url';

export const AddOwnRecipeModal: React.FC<AddOwnRecipeModalProps> = ({
  isOpen,
  onClose,
  onSaveRecipe,
}) => {
  const [mode, setMode] = useState<InputMode>('paste');
  const [rawText, setRawText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedRecipe, setParsedRecipe] = useState<Recipe | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetAll = () => {
    setRawText('');
    setUrlInput('');
    setFileName(null);
    setImageBase64(null);
    setImageMimeType(null);
    setImagePreviewUrl(null);
    setError(null);
    setParsedRecipe(null);
    setMode('paste');
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileName(file.name);
    setRawText('');
    setImageBase64(null);
    setImageMimeType(null);
    setImagePreviewUrl(null);

    const isTextFile = file.type.startsWith('text/') || /\.(txt|md)$/i.test(file.name);
    const isImageFile = file.type.startsWith('image/');

    if (isTextFile) {
      const reader = new FileReader();
      reader.onload = () => setRawText(String(reader.result || ''));
      reader.onerror = () => setError('Could not read that file.');
      reader.readAsText(file);
    } else if (isImageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const base64 = dataUrl.split(',')[1] || '';
        setImageBase64(base64);
        setImageMimeType(file.type);
        setImagePreviewUrl(dataUrl);
      };
      reader.onerror = () => setError('Could not read that image.');
      reader.readAsDataURL(file);
    } else {
      setError('Please upload a text file (.txt, .md) or a photo (.jpg, .png, .webp) of the recipe.');
    }
  };

  const handleParse = async () => {
    if (mode === 'url' && !urlInput.trim()) return;
    if (mode !== 'url' && !rawText.trim() && !imageBase64) return;
    setIsParsing(true);
    setError(null);
    setParsedRecipe(null);

    try {
      const body = mode === 'url'
        ? { url: urlInput.trim() }
        : imageBase64
          ? { imageBase64, imageMimeType }
          : { rawText };

      const res = await fetch('/api/gemini/recipe-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const rawResponseText = await res.text();
      let data: any;
      try {
        data = JSON.parse(rawResponseText);
      } catch {
        throw new Error(
          `Server returned a non-JSON response (status ${res.status}). ` +
          `This usually means the request timed out or crashed before finishing. ` +
          `First 200 chars: ${rawResponseText.slice(0, 200) || '(empty response)'}`
        );
      }
      if (!data.success) {
        throw new Error(data.error || 'Failed to parse recipe');
      }

      const r = data.recipe;
      const recipe: Recipe = {
        id: `custom-rec-${Date.now()}`,
        title: r.title || 'My Recipe',
        description: r.description || '',
        prepTime: r.prepTime || 15,
        cookTime: r.cookTime || 20,
        servings: r.servings || 4,
        category: r.category || 'Family Favorite',
        difficulty: r.difficulty || 'Easy',
        tags: r.tags || ['Family Recipe'],
        calories: r.calories || undefined,
        source: 'Family Favorite',
        ingredients: (r.ingredients || []).map((ing: any) => ({ name: ing.name, amount: ing.amount })),
        instructions: r.instructions || []
      };

      setParsedRecipe(recipe);
      setIsParsing(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error parsing your recipe. Try pasting the text instead of uploading, or double-check the photo is clear.');
      setIsParsing(false);
    }
  };

  const handleConfirmSave = () => {
    if (!parsedRecipe) return;
    onSaveRecipe(parsedRecipe);
    resetAll();
    onClose();
  };

  const hasInput = mode === 'paste'
    ? rawText.trim().length > 0
    : mode === 'url'
      ? urlInput.trim().length > 0
      : !!imageBase64 || rawText.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative my-8">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-violet-600">
          <ChefHat className="w-5 h-5" />
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Add My Own Recipe</h3>
        </div>

        {!parsedRecipe && (
          <p className="text-xs text-slate-500">
            Upload a photo of a recipe card, a text file, or just paste the recipe below. Gemini AI will turn it into a full recipe card — and it'll show up alongside your other recipes with a live pantry match, just like the rest.
          </p>
        )}

        {error && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        {!parsedRecipe && (
          <>
            {/* Mode Toggle */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-1 text-xs font-bold w-fit">
              <button
                onClick={() => { setMode('paste'); setError(null); }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  mode === 'paste' ? 'bg-white dark:bg-slate-700 shadow-xs text-violet-700 dark:text-violet-300' : 'text-slate-500'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Paste Text
              </button>
              <button
                onClick={() => { setMode('file'); setError(null); }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  mode === 'file' ? 'bg-white dark:bg-slate-700 shadow-xs text-violet-700 dark:text-violet-300' : 'text-slate-500'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload File
              </button>
              <button
                onClick={() => { setMode('url'); setError(null); }}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  mode === 'url' ? 'bg-white dark:bg-slate-700 shadow-xs text-violet-700 dark:text-violet-300' : 'text-slate-500'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" /> From Website
              </button>
            </div>

            {mode === 'url' && (
              <div className="space-y-2">
                <input
                  type="url"
                  placeholder="https://example.com/recipe/creamy-garlic-chicken"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-[11px] text-slate-400">
                  Paste a link to any recipe page — a blog, AllRecipes, NYT Cooking, etc. Gemini will read the page and pull out the recipe.
                </p>
              </div>
            )}

            {mode === 'paste' && (
              <textarea
                rows={6}
                placeholder="Paste your recipe here — ingredients, amounts, and steps, in whatever format you have it..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            )}

            {mode === 'file' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-6 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-violet-400 hover:text-violet-600 transition-all"
                >
                  {imagePreviewUrl ? (
                    <ImageIcon className="w-6 h-6" />
                  ) : (
                    <UploadCloud className="w-6 h-6" />
                  )}
                  <span className="text-xs font-bold">
                    {fileName ? fileName : 'Click to choose a photo or text file'}
                  </span>
                  <span className="text-[10px] text-slate-400">.jpg, .png, .webp, .txt, .md</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.txt,.md,text/plain,text/markdown"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {imagePreviewUrl && (
                  <img src={imagePreviewUrl} alt="Recipe preview" className="w-full max-h-56 object-contain rounded-xl border border-slate-200 dark:border-slate-700" />
                )}

                {rawText && !imageBase64 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {rawText}
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleParse}
                disabled={isParsing || !hasInput}
                className="px-5 py-2 bg-violet-600 text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-violet-700 disabled:opacity-50 flex items-center space-x-2"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Reading Recipe...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Parse My Recipe</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {/* Preview & Confirm */}
        {parsedRecipe && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-900 space-y-2">
              <div className="flex items-center gap-2 text-violet-700 dark:text-violet-300 text-xs font-extrabold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Recipe parsed! Review before saving:</span>
              </div>
              <h4 className="font-black text-slate-900 dark:text-white text-base">{parsedRecipe.title}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300">{parsedRecipe.description}</p>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1">
                <span>{parsedRecipe.prepTime + parsedRecipe.cookTime} mins total</span>
                <span>•</span>
                <span>{parsedRecipe.servings} servings</span>
                <span>•</span>
                <span>{parsedRecipe.ingredients.length} ingredients</span>
                <span>•</span>
                <span>{parsedRecipe.instructions.length} steps</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setParsedRecipe(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600"
              >
                Back
              </button>
              <button
                onClick={handleConfirmSave}
                className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-emerald-700"
              >
                Save to My Recipes
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

