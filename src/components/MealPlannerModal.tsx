import React, { useState } from 'react';
import { X, Utensils, Calendar as CalendarIcon } from 'lucide-react';
import { Recipe, FamilyMember } from '../types';

interface MealPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  members: FamilyMember[];
  preSelectedRecipe?: Recipe | null;
  defaultDate?: string;
  onConfirmScheduleMeal: (recipeId: string, date: string, mealType: 'breakfast' | 'lunch' | 'dinner', memberIds: string[]) => void;
}

export const MealPlannerModal: React.FC<MealPlannerModalProps> = ({
  isOpen,
  onClose,
  recipes,
  members,
  preSelectedRecipe,
  defaultDate,
  onConfirmScheduleMeal,
}) => {
  const [recipeId, setRecipeId] = useState(preSelectedRecipe ? preSelectedRecipe.id : (recipes[0]?.id || ''));
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner'>('dinner');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(members.map(m => m.id));

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeId || !date) return;
    onConfirmScheduleMeal(recipeId, date, mealType, selectedMemberIds);
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

        <div className="flex items-center space-x-2 text-amber-600">
          <Utensils className="w-5 h-5" />
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Schedule Family Meal</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Select Recipe:
            </label>
            <select
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white"
            >
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.title} ({r.category})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Meal Date:
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                Meal Slot:
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl capitalize"
              >
                <option value="dinner">Dinner</option>
                <option value="lunch">Lunch</option>
                <option value="breakfast">Breakfast</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
              Attending Family Members:
            </label>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {members.map(m => {
                const isSelected = selectedMemberIds.includes(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => {
                      if (isSelected) {
                        if (selectedMemberIds.length > 1) setSelectedMemberIds(selectedMemberIds.filter(id => id !== m.id));
                      } else {
                        setSelectedMemberIds([...selectedMemberIds, m.id]);
                      }
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                      isSelected ? `${m.badgeClass}` : `${m.bgClass} opacity-60`
                    }`}
                  >
                    {m.name}
                  </button>
                );
              })}
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
              className="px-5 py-2 bg-amber-600 text-white rounded-xl font-extrabold shadow-sm hover:bg-amber-700"
            >
              Add to Calendar
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
