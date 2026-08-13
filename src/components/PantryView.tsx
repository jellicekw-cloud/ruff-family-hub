import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3, 
  ShoppingCart, 
  Sparkles, 
  FileText, 
  Calendar, 
  RefreshCw,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { PantryItem, CategoryType } from '../types';

interface PantryViewProps {
  pantry: PantryItem[];
  onAddPantryItem: () => void;
  onEditPantryItem: (item: PantryItem) => void;
  onDeletePantryItem: (id: string) => void;
  onClearAllPantry?: () => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSyncToShoppingList: (items: PantryItem[]) => void;
  onOpenSmartImport: () => void;
}

export const PantryView: React.FC<PantryViewProps> = ({
  pantry,
  onAddPantryItem,
  onEditPantryItem,
  onDeletePantryItem,
  onClearAllPantry,
  onUpdateQuantity,
  onSyncToShoppingList,
  onOpenSmartImport,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  // Filter items
  const filteredItems = pantry.filter(item => {
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'IN_STOCK') matchesStatus = item.status === 'in_stock';
    if (statusFilter === 'RUNNING_LOW') matchesStatus = item.status === 'running_low';
    if (statusFilter === 'OUT_OF_STOCK') matchesStatus = item.status === 'out_of_stock';
    if (statusFilter === 'EXPIRING_SOON') {
      if (!item.expiryDate) return false;
      const exp = new Date(item.expiryDate);
      const now = new Date();
      const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
      matchesStatus = diffDays <= 4 && diffDays >= -1;
    }

    return matchesCategory && matchesSearch && matchesStatus;
  });

  const lowOrOutItems = pantry.filter(i => i.status === 'running_low' || i.status === 'out_of_stock');

  const statusBadge = (status: PantryItem['status']) => {
    switch (status) {
      case 'in_stock':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3" />
            <span>In Stock</span>
          </span>
        );
      case 'running_low':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3" />
            <span>Running Low</span>
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
            <XCircle className="w-3 h-3" />
            <span>Out of Stock</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Quick Actions */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Package className="w-6 h-6 text-emerald-200" />
            <h2 className="text-xl font-extrabold tracking-tight">Pantry & Inventory Center</h2>
          </div>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
            Keep track of what you have at home. Ingredients in your pantry are automatically cross-referenced to find instant recipe ideas!
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {lowOrOutItems.length > 0 && (
            <button
              onClick={() => onSyncToShoppingList(lowOrOutItems)}
              className="bg-white text-emerald-800 hover:bg-emerald-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all flex items-center space-x-2"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <span>Add {lowOrOutItems.length} Low/Out Items to Shopping List</span>
            </button>
          )}

          {pantry.length > 0 && onClearAllPantry && (
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to remove all items from your pantry?')) {
                  onClearAllPantry();
                }
              }}
              className="bg-rose-900/80 hover:bg-rose-900 text-white border border-rose-400/40 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5"
              title="Remove all items in pantry"
            >
              <Trash2 className="w-4 h-4 text-rose-200" />
              <span>Clear All</span>
            </button>
          )}

          <button
            onClick={onOpenSmartImport}
            className="bg-emerald-800/80 hover:bg-emerald-800 text-white border border-emerald-400/40 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Receipt / Note Import</span>
          </button>

          <button
            onClick={onAddPantryItem}
            className="bg-emerald-950 hover:bg-black text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search pantry items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Status Filter Buttons */}
          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none text-xs font-medium bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              All Items ({pantry.length})
            </button>
            <button
              onClick={() => setStatusFilter('IN_STOCK')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'IN_STOCK' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              In Stock
            </button>
            <button
              onClick={() => setStatusFilter('RUNNING_LOW')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'RUNNING_LOW' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Running Low
            </button>
            <button
              onClick={() => setStatusFilter('OUT_OF_STOCK')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'OUT_OF_STOCK' ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Out of Stock
            </button>
            <button
              onClick={() => setStatusFilter('EXPIRING_SOON')}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                statusFilter === 'EXPIRING_SOON' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Expiring Soon
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 pt-1 scrollbar-none border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all whitespace-nowrap ${
              selectedCategory === 'ALL'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

      </div>

      {/* Pantry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <Package className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-bold text-slate-700 dark:text-slate-200">No pantry items found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Try adjusting your search or category filter, or add new ingredients to your pantry.
            </p>
            <button
              onClick={onAddPantryItem}
              className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700"
            >
              + Add New Pantry Item
            </button>
          </div>
        ) : (
          filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {item.category}
                  </span>
                  {statusBadge(item.status)}
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug">
                    {item.name}
                  </h3>
                  {item.expiryDate && (
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      Expires: {item.expiryDate}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {/* Quantity Controls */}
                <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="text-slate-500 hover:text-rose-600 transition-colors"
                    title="Decrease quantity"
                  >
                    <MinusCircle className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-slate-900 dark:text-white min-w-[28px] text-center">
                    {item.quantity} <span className="text-[10px] font-medium text-slate-400">{item.unit}</span>
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="text-slate-500 hover:text-emerald-600 transition-colors"
                    title="Increase quantity"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Edit / Delete */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onEditPantryItem(item)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit item"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeletePantryItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
