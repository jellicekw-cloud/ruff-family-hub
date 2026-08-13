import React, { useState, useEffect } from 'react';
import { X, Package } from 'lucide-react';
import { PantryItem, CategoryType } from '../types';

interface AddPantryModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: PantryItem | null;
  onSaveItem: (item: Partial<PantryItem>) => void;
}

export const AddPantryModal: React.FC<AddPantryModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
  onSaveItem,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CategoryType>('Produce');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('pcs');
  const [status, setStatus] = useState<PantryItem['status']>('in_stock');
  const [expiryDate, setExpiryDate] = useState('');

  const categories: CategoryType[] = [
    'Produce', 
    'Dairy & Eggs', 
    'Meat & Seafood', 
    'Pantry & Grains', 
    'Spices & Condiments', 
    'Canned Goods', 
    'Snacks & Drinks', 
    'Frozen', 
    'Bakery'
  ];

  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setCategory(itemToEdit.category);
      setQuantity(itemToEdit.quantity);
      setUnit(itemToEdit.unit || 'pcs');
      setStatus(itemToEdit.status);
      setExpiryDate(itemToEdit.expiryDate || '');
    } else {
      setName('');
      setCategory('Produce');
      setQuantity(1);
      setUnit('pcs');
      setStatus('in_stock');
      setExpiryDate('');
    }
  }, [itemToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSaveItem({
      id: itemToEdit ? itemToEdit.id : undefined,
      name: name.trim(),
      category,
      quantity,
      unit,
      status: quantity === 0 ? 'out_of_stock' : status,
      expiryDate: expiryDate || undefined,
      updatedAt: new Date().toISOString().split('T')[0]
    });

    onClose();
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

        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {itemToEdit ? 'Edit Pantry Ingredient' : 'Add Pantry Ingredient'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Ingredient Name:
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Roma Tomatoes, Jasmine Rice, Olive Oil"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Category:
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryType)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Quantity:
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Unit:
              </label>
              <input
                type="text"
                placeholder="e.g. pcs, lbs, cups, box, cans"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Stock Status:
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PantryItem['status'])}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="in_stock">In Stock</option>
                <option value="running_low">Running Low</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Expiry Date (Optional):
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-extrabold shadow-sm hover:bg-emerald-700"
            >
              Save Ingredient
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
