import React, { useState } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  CheckCircle2, 
  Trash2, 
  AlertCircle, 
  RotateCcw, 
  Users, 
  Tag, 
  Sparkles,
  PackageCheck
} from 'lucide-react';
import { ShoppingItem, FamilyMember, CategoryType } from '../types';

interface ShoppingListViewProps {
  shoppingList: ShoppingItem[];
  members: FamilyMember[];
  onToggleItemComplete: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onAddShoppingItem: (item: Partial<ShoppingItem>) => void;
  onRestockToPantry: () => void;
  onClearCompleted: () => void;
}

export const ShoppingListView: React.FC<ShoppingListViewProps> = ({
  shoppingList,
  members,
  onToggleItemComplete,
  onDeleteItem,
  onAddShoppingItem,
  onRestockToPantry,
  onClearCompleted,
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<CategoryType>('Produce');
  const [newItemQty, setNewItemQty] = useState('1');
  const [newItemUrgent, setNewItemUrgent] = useState(false);
  const [assignedMemberId, setAssignedMemberId] = useState<string>('');

  const completedCount = shoppingList.filter(i => i.isCompleted).length;
  const pendingCount = shoppingList.length - completedCount;

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

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    onAddShoppingItem({
      name: newItemName.trim(),
      category: newItemCategory,
      quantity: newItemQty || '1',
      urgent: newItemUrgent,
      assignedToMemberId: assignedMemberId || undefined,
      isCompleted: false,
      createdAt: new Date().toISOString().split('T')[0]
    });

    setNewItemName('');
    setNewItemQty('1');
    setNewItemUrgent(false);
  };

  const getMember = (id?: string) => members.find(m => m.id === id);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-700 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-6 h-6 text-blue-200" />
            <h2 className="text-xl font-extrabold tracking-tight">Family Shopping List</h2>
          </div>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
            Automatically populated when pantry items run low or recipe ingredients are missing. Cross off items as you shop and restock them to your pantry with 1 click!
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          {completedCount > 0 && (
            <button
              onClick={onRestockToPantry}
              className="bg-white text-blue-900 hover:bg-blue-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold shadow-sm transition-all flex items-center space-x-2"
            >
              <PackageCheck className="w-4 h-4 text-emerald-600" />
              <span>Restock {completedCount} Purchased Items to Pantry</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              onClick={onClearCompleted}
              className="bg-blue-900/60 hover:bg-blue-950 text-white px-3 py-2 rounded-xl text-xs font-bold transition-all"
            >
              Clear Checked
            </button>
          )}
        </div>
      </div>

      {/* Quick Add Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          + Quick Add Item to Shopping List
        </h3>
        
        <form onSubmit={handleCreateItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Item name (e.g., Organic Milk, Whole Wheat Bread)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as CategoryType)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <input
              type="text"
              placeholder="Qty (e.g. 2 boxes)"
              value={newItemQty}
              onChange={(e) => setNewItemQty(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-2">
            <select
              value={assignedMemberId}
              onChange={(e) => setAssignedMemberId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
            >
              <option value="">Assign Errand to...</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-1 flex items-center justify-end">
            <button
              type="submit"
              className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold py-2 sm:py-0 flex items-center justify-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span className="sm:hidden">Add</span>
            </button>
          </div>
        </form>
      </div>

      {/* Shopping List Items */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900 dark:text-white text-base">Needed Items</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              {pendingCount} remaining
            </span>
          </div>

          {completedCount > 0 && (
            <span className="text-xs text-slate-400 font-medium">
              {completedCount} completed
            </span>
          )}
        </div>

        <div className="space-y-2">
          {shoppingList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Your shopping list is empty! Items will automatically appear when pantry items run out.
            </div>
          ) : (
            shoppingList.map(item => {
              const assigned = getMember(item.assignedToMemberId);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    item.isCompleted
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                      : item.urgent
                      ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* Custom Checkbox */}
                    <button
                      onClick={() => onToggleItemComplete(item.id)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 ${
                        item.isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                      }`}
                    >
                      {item.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                    </button>

                    {/* Text Details */}
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-0.5">
                        <span className={`text-sm font-extrabold ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                          {item.name}
                        </span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          ({item.quantity})
                        </span>
                        
                        {item.urgent && !item.isCompleted && (
                          <span className="px-2 py-0.2 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" /> URGENT
                          </span>
                        )}

                        {item.sourceRecipeTitle && (
                          <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.2 rounded border border-amber-200">
                            For {item.sourceRecipeTitle}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
                        <span>Category: {item.category}</span>
                        {assigned && (
                          <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: assigned.color }} />
                            Assigned to {assigned.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
