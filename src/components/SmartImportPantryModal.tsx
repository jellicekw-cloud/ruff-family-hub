import React, { useState } from 'react';
import { X, Sparkles, Loader2, PackageCheck } from 'lucide-react';
import { PantryItem, CategoryType } from '../types';

interface SmartImportPantryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddParsedItems: (items: Partial<PantryItem>[]) => void;
}

export const SmartImportPantryModal: React.FC<SmartImportPantryModalProps> = ({
  isOpen,
  onClose,
  onAddParsedItems,
}) => {
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = async () => {
    if (!rawText.trim()) return;
    setIsParsing(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/pantry-parser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to parse text');
      }

      const parsed: Partial<PantryItem>[] = data.items.map((it: any) => ({
        name: it.name,
        category: (it.category as CategoryType) || 'Pantry & Grains',
        quantity: typeof it.quantity === 'number' ? it.quantity : 1,
        unit: it.unit || 'pcs',
        status: 'in_stock' as const,
        updatedAt: new Date().toISOString().split('T')[0]
      }));

      onAddParsedItems(parsed);
      setRawText('');
      setIsParsing(false);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing receipt/note text.');
      setIsParsing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-emerald-600">
          <Sparkles className="w-5 h-5" />
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Receipt & Grocery Note Import</h3>
        </div>

        <p className="text-xs text-slate-500">
          Paste your receipt text, grocery note, or shopping list below. Gemini AI will extract items, quantities, and categories automatically into your pantry!
        </p>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-800 text-xs font-bold rounded-xl border border-rose-200">
            {error}
          </div>
        )}

        <textarea
          rows={5}
          placeholder="e.g. Bought 2 gallons whole milk, 3 avocados, 1 bag shredded mozzarella cheese, 2 boxes penne pasta, 1 bunch fresh asparagus"
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />

        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600"
          >
            Cancel
          </button>
          <button
            onClick={handleParse}
            disabled={isParsing || !rawText.trim()}
            className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-extrabold shadow-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isParsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Parsing Items...</span>
              </>
            ) : (
              <>
                <PackageCheck className="w-4 h-4" />
                <span>Parse & Add to Pantry</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
