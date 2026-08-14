import React from 'react';
import { 
  Calendar as CalendarIcon, 
  Package, 
  ChefHat, 
  ShoppingCart, 
  Users, 
  RefreshCw, 
  Sparkles,
  PlusCircle,
  Clock,
  CheckSquare,
  Gift
} from 'lucide-react';
import { SyncCalendarConfig } from '../types';

interface NavbarProps {
  activeTab: 'calendar' | 'chores' | 'pantry' | 'recipes' | 'shopping' | 'members' | 'rewards';
  setActiveTab: (tab: 'calendar' | 'chores' | 'pantry' | 'recipes' | 'shopping' | 'members' | 'rewards') => void;
  syncConfig: SyncCalendarConfig;
  onOpenConnectCalendar: () => void;
  onOpenAddEvent: () => void;
  onOpenAddPantry: () => void;
  onOpenAddChore?: () => void;
  lowPantryCount: number;
  shoppingPendingCount: number;
  todayEventsCount: number;
  pendingChoresCount?: number;
  pendingRewardsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  syncConfig,
  onOpenConnectCalendar,
  onOpenAddEvent,
  onOpenAddPantry,
  onOpenAddChore,
  lowPantryCount,
  shoppingPendingCount,
  todayEventsCount,
  pendingChoresCount = 0,
  pendingRewardsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('calendar')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-violet-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">The Ruffs</span>
                <span className="px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-full shadow-xs">
                  Family Hub
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Calendar, Cleaning, Pantry & Recipes</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-violet-600" />
              <span>Calendar</span>
              {todayEventsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200 rounded-full font-bold">
                  {todayEventsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('chores')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chores'
                  ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-cyan-600" />
              <span>Chores</span>
              {pendingChoresCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200 rounded-full font-bold">
                  {pendingChoresCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('pantry')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'pantry'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Pantry</span>
              {lowPantryCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 rounded-full font-bold">
                  {lowPantryCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'recipes'
                  ? 'bg-white dark:bg-slate-700 text-amber-700 dark:text-amber-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4 text-amber-600" />
              <span>Recipes</span>
              <span className="px-1.5 py-0.2 text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-md font-semibold flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5" /> AI
              </span>
            </button>

            <button
              onClick={() => setActiveTab('shopping')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'shopping'
                  ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span>Shopping</span>
              {shoppingPendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full font-bold">
                  {shoppingPendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('rewards')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'rewards'
                  ? 'bg-white dark:bg-slate-700 text-fuchsia-700 dark:text-fuchsia-300 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Gift className="w-4 h-4 text-fuchsia-600" />
              <span>Rewards</span>
              {pendingRewardsCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 text-xs bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-200 rounded-full font-bold">
                  {pendingRewardsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('members')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'members'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>Family</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Calendar Sync Status Button */}
            <button
              onClick={onOpenConnectCalendar}
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                syncConfig.isConnected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
              }`}
              title="Manage Calendar Connection"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncConfig.isConnected ? 'text-emerald-600 dark:text-emerald-400 animate-pulse' : ''}`} />
              <span>{syncConfig.isConnected ? 'Calendar Connected' : 'Connect Calendar'}</span>
            </button>

            {/* Quick Add Button depending on Tab */}
            {activeTab === 'calendar' ? (
              <button
                onClick={onOpenAddEvent}
                className="flex items-center space-x-1.5 bg-violet-600 hover:bg-violet-700 text-white px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add Event</span>
              </button>
            ) : activeTab === 'chores' && onOpenAddChore ? (
              <button
                onClick={onOpenAddChore}
                className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-700 text-white px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add Chore</span>
              </button>
            ) : activeTab === 'pantry' ? (
              <button
                onClick={onOpenAddPantry}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-sm font-semibold shadow-sm transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Add Ingredient</span>
              </button>
            ) : null}
          </div>

        </div>
      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto border-t border-slate-200 dark:border-slate-800 py-2 px-1 bg-slate-50 dark:bg-slate-900">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex flex-col items-center space-y-0.5 text-xs font-medium flex-shrink-0 px-2.5 ${
            activeTab === 'calendar' ? 'text-violet-600 dark:text-violet-400 font-bold' : 'text-slate-500'
          }`}
        >
          <CalendarIcon className="w-5 h-5" />
          <span>Calendar</span>
        </button>
        <button
          onClick={() => setActiveTab('chores')}
          className={`flex flex-col items-center space-y-0.5 text-xs font-medium flex-shrink-0 px-2.5 ${
            activeTab === 'chores' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : 'text-slate-500'
          }`}
        >
          <CheckSquare className="w-5 h-5" />
          <span>Chores</span>
        </button>
        <button
          onClick={() => setActiveTab('pantry')}
          className={`flex flex-col items-center space-y-0.5 text-xs font-medium flex-shrink-0 px-2.5 ${
            activeTab === 'pantry' ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Pantry</span>
        </button>
        <button
          onClick={() => setActiveTab('recipes')}
          className={`flex flex-col items-center space-y-0.5 text-xs font-medium flex-shrink-0 px-2.5 ${
            activeTab === 'recipes' ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500'
          }`}
        >
          <ChefHat className="w-5 h-5" />
          <span>Recipes</span>
        </button>
        <button
          onClick={() => setActiveTab('shopping')}
          className={`flex flex-col items-center space-y-0.5 text-xs font-medium flex-shrink-0 px-2.5 ${
            activeTab === 'shopping' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          <span>Shopping</span>
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`relative flex flex-col items-center space-y-0.5 text-xs font-medium flex-shrink-0 px-2.5 ${
            activeTab === 'rewards' ? 'text-fuchsia-600 dark:text-fuchsia-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Gift className="w-5 h-5" />
          <span>Rewards</span>
          {pendingRewardsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] bg-fuchsia-600 text-white rounded-full font-bold">
              {pendingRewardsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex flex-col items-center space-y-0.5 text-xs font-medium flex-shrink-0 px-2.5 ${
            activeTab === 'members' ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Family</span>
        </button>
      </div>
    </header>
  );
};

