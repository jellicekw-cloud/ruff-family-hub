/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AnnouncementBanner } from './components/AnnouncementBanner';
import { CalendarView } from './components/CalendarView';
import { ChoresView } from './components/ChoresView';
import { PantryView } from './components/PantryView';
import { RecipeView } from './components/RecipeView';
import { ShoppingListView } from './components/ShoppingListView';
import { FamilyMembersView } from './components/FamilyMembersView';

import { ConnectCalendarModal } from './components/ConnectCalendarModal';
import { AddEventModal } from './components/AddEventModal';
import { AddPantryModal } from './components/AddPantryModal';
import { AddChoreModal } from './components/AddChoreModal';
import { SmartImportPantryModal } from './components/SmartImportPantryModal';
import { MealPlannerModal } from './components/MealPlannerModal';

import { 
  FamilyMember, 
  CalendarEvent, 
  PantryItem, 
  Recipe, 
  ShoppingItem, 
  SyncCalendarConfig,
  ChoreItem
} from './types';
import { storageService } from './services/storageService';
import { celebrateChoreComplete, celebrateBigMilestone } from './utils/confetti';
import { WEEKLY_CHORE_POOL } from './data/initialData';
import { isSupabaseConfigured } from './services/supabaseClient';
import {
  fetchPantryFromSupabase,
  syncPantryToSupabase,
  fetchShoppingListFromSupabase,
  syncShoppingListToSupabase,
  fetchFamilyMembersFromSupabase,
  syncFamilyMembersToSupabase
} from './services/supabaseSyncService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'chores' | 'pantry' | 'recipes' | 'shopping' | 'members'>('calendar');

  // House-wide scrolling announcements. Add/remove strings here to update the ticker banner.
  const houseAnnouncements = [
    'Do Not Leave Clothes in the Laundry Room!'
  ];

  // Core Data States
  const [members, setMembers] = useState<FamilyMember[]>(() => storageService.getMembers());
  const [events, setEvents] = useState<CalendarEvent[]>(() => storageService.getEvents());
  const [chores, setChores] = useState<ChoreItem[]>(() => storageService.getChores());
  // Pantry & Shopping List are synced to Supabase (shared across devices, e.g. a family tablet + your phone).
  // Local state seeds from localStorage/initial data first, then gets replaced by the Supabase fetch on mount.
  const [pantry, setPantry] = useState<PantryItem[]>(() => storageService.getPantry());
  const [recipes, setRecipes] = useState<Recipe[]>(() => storageService.getRecipes());
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => storageService.getShoppingList());
  const [syncConfig, setSyncConfig] = useState<SyncCalendarConfig>(() => storageService.getSyncConfig());
  const [isCloudDataLoaded, setIsCloudDataLoaded] = useState(!isSupabaseConfigured);
  const [cloudSyncError, setCloudSyncError] = useState<string | null>(null);

  // Modal States
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [eventDefaultDate, setEventDefaultDate] = useState<string | undefined>(undefined);

  const [showAddChoreModal, setShowAddChoreModal] = useState(false);
  const [choreToEdit, setChoreToEdit] = useState<ChoreItem | null>(null);

  const [showAddPantryModal, setShowAddPantryModal] = useState(false);
  const [pantryToEdit, setPantryToEdit] = useState<PantryItem | null>(null);

  const [showSmartImportModal, setShowSmartImportModal] = useState(false);

  const [showMealPlannerModal, setShowMealPlannerModal] = useState(false);
  const [preSelectedRecipe, setPreSelectedRecipe] = useState<Recipe | null>(null);

  // Auto Save to storage
  useEffect(() => { storageService.saveEvents(events); }, [events]);
  useEffect(() => { storageService.saveChores(chores); }, [chores]);
  useEffect(() => { storageService.saveRecipes(recipes); }, [recipes]);
  useEffect(() => { storageService.saveSyncConfig(syncConfig); }, [syncConfig]);

  // One-time load of Family Members, Pantry & Shopping List from Supabase (falls back to
  // whatever was already seeded from localStorage/initial data if Supabase isn't reachable).
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let cancelled = false;
    (async () => {
      const [cloudMembers, cloudPantry, cloudShopping] = await Promise.all([
        fetchFamilyMembersFromSupabase(),
        fetchPantryFromSupabase(),
        fetchShoppingListFromSupabase()
      ]);
      if (cancelled) return;

      if (cloudMembers === null && cloudPantry === null && cloudShopping === null) {
        setCloudSyncError('Could not reach Supabase — using data saved on this device only.');
      } else {
        // Family Members: only adopt cloud data once it's actually been seeded.
        // An empty cloud table (first-ever sync) means "not seeded yet," not "delete everyone" —
        // in that case we keep local data as-is and let the write-sync effect push it up instead.
        if (cloudMembers !== null && cloudMembers.length > 0) setMembers(cloudMembers);
        if (cloudPantry !== null) setPantry(cloudPantry);
        if (cloudShopping !== null) setShoppingList(cloudShopping);
      }
      setIsCloudDataLoaded(true);
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Family Members: same cache-then-sync pattern as Pantry/Shopping List below.
  useEffect(() => {
    storageService.saveMembers(members);
    if (!isCloudDataLoaded) return;
    syncFamilyMembersToSupabase(members).catch(err => console.error('Family members cloud sync failed:', err));
  }, [members, isCloudDataLoaded]);

  // Pantry: always cache locally; push to Supabase once the initial cloud load has finished
  // (so we don't stomp on cloud data with local seed data while the fetch is still in flight).
  useEffect(() => {
    storageService.savePantry(pantry);
    if (!isCloudDataLoaded) return;
    syncPantryToSupabase(pantry).catch(err => console.error('Pantry cloud sync failed:', err));
  }, [pantry, isCloudDataLoaded]);

  // Shopping List: same pattern as Pantry above.
  useEffect(() => {
    storageService.saveShoppingList(shoppingList);
    if (!isCloudDataLoaded) return;
    syncShoppingListToSupabase(shoppingList).catch(err => console.error('Shopping list cloud sync failed:', err));
  }, [shoppingList, isCloudDataLoaded]);

  // Derived counts for navbar badges
  const lowPantryCount = pantry.filter(i => i.status === 'running_low' || i.status === 'out_of_stock').length;
  const shoppingPendingCount = shoppingList.filter(s => !s.isCompleted).length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEventsCount = events.filter(e => e.date === todayStr).length;
  const pendingChoresCount = chores.filter(c => !c.isCompleted).length;

  // --- CHORE HANDLERS ---
  const handleToggleChore = (id: string) => {
    const target = chores.find(c => c.id === id);
    const willBeCompleted = target ? !target.isCompleted : false;

    setChores(chores.map(c => {
      if (c.id === id) {
        const nextCompleted = !c.isCompleted;
        return {
          ...c,
          isCompleted: nextCompleted,
          completedAt: nextCompleted ? todayStr : undefined
        };
      }
      return c;
    }));

    if (willBeCompleted) {
      const remainingAfterThis = chores.filter(c => c.id !== id && !c.isCompleted).length;
      if (remainingAfterThis === 0) {
        celebrateBigMilestone();
      } else {
        celebrateChoreComplete();
      }
    }
  };

  const handleSaveChore = (partialChore: Partial<ChoreItem>) => {
    if (partialChore.id) {
      setChores(chores.map(c => c.id === partialChore.id ? { ...c, ...partialChore } as ChoreItem : c));
    } else {
      const newChore: ChoreItem = {
        id: `chore-${Date.now()}`,
        title: partialChore.title || 'Clean Room',
        area: partialChore.area || 'Kitchen',
        assignedMemberId: partialChore.assignedMemberId,
        frequency: partialChore.frequency || 'Weekly',
        dueDate: partialChore.dueDate || todayStr,
        isCompleted: false,
        priority: partialChore.priority || 'Medium',
        points: partialChore.points || 15,
        notes: partialChore.notes
      };
      setChores([...chores, newChore]);
    }
  };

  const handleDeleteChore = (id: string) => {
    setChores(chores.filter(c => c.id !== id));
  };

  const handleSyncChoresToCalendar = () => {
    const pendingChores = chores.filter(c => !c.isCompleted);
    const existingTitles = events.map(e => e.title.toLowerCase());
    const newEvents: CalendarEvent[] = [];

    pendingChores.forEach(c => {
      const title = `Chore: ${c.title}`;
      if (!existingTitles.includes(title.toLowerCase())) {
        newEvents.push({
          id: `evt-chore-${c.id}-${Date.now()}`,
          title,
          memberIds: c.assignedMemberId ? [c.assignedMemberId] : [members[0]?.id || 'mem-1'],
          date: c.dueDate || todayStr,
          startTime: '10:00',
          endTime: '11:00',
          category: 'chores',
          location: `${c.area} Cleaning`,
          notes: c.notes || `Assigned chore for ${c.area}`
        });
      }
    });

    if (newEvents.length > 0) {
      setEvents([...events, ...newEvents]);
      alert(`Synced ${newEvents.length} pending chores directly to your Family Calendar!`);
    } else {
      alert('All pending chores are already synced on your calendar!');
    }
  };

  const handleRandomizeWeeklyChores = () => {
    if (members.length === 0) {
      alert('Add a family member first so there\'s someone to assign chores to!');
      return;
    }

    // Monday-through-Sunday range for "this week"
    const now = new Date();
    const day = now.getDay(); // 0 = Sun ... 6 = Sat
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);

    const weekDates: string[] = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
    const weekStart = weekDates[0];
    const weekEnd = weekDates[6];

    // Clear out any previously-randomized chores for this same week so re-rolling doesn't duplicate
    const poolTitles = new Set(WEEKLY_CHORE_POOL.map(p => p.title));
    const keptChores = chores.filter(c => !(poolTitles.has(c.title) && c.dueDate >= weekStart && c.dueDate <= weekEnd));

    // Shuffle family members so the rotation is different each time
    const shuffledMembers = [...members].sort(() => Math.random() - 0.5);

    const newChores: ChoreItem[] = WEEKLY_CHORE_POOL.map((preset, idx) => ({
      id: `chore-rand-${Date.now()}-${idx}`,
      title: preset.title,
      area: preset.area,
      assignedMemberId: shuffledMembers[idx % shuffledMembers.length].id,
      frequency: 'Weekly',
      dueDate: weekDates[idx % weekDates.length],
      isCompleted: false,
      priority: 'Medium',
      points: preset.points
    }));

    setChores([...keptChores, ...newChores]);
    setActiveTab('chores');

    const summary = newChores
      .map(c => `${members.find(m => m.id === c.assignedMemberId)?.name || 'Someone'} → ${c.area}`)
      .join('\n');
    alert(`🎲 This week's chores are randomized!\n\n${summary}`);
  };

  // --- CALENDAR HANDLERS ---
  const handleSaveEvent = (partialEvent: Partial<CalendarEvent>) => {
    if (partialEvent.id) {
      setEvents(events.map(e => e.id === partialEvent.id ? { ...e, ...partialEvent } as CalendarEvent : e));
    } else {
      const newEvt: CalendarEvent = {
        id: `evt-${Date.now()}`,
        title: partialEvent.title || 'Family Event',
        memberIds: partialEvent.memberIds || [members[0]?.id || 'mem-1'],
        date: partialEvent.date || todayStr,
        startTime: partialEvent.startTime || '18:00',
        endTime: partialEvent.endTime || '19:00',
        category: partialEvent.category || 'general',
        location: partialEvent.location,
        notes: partialEvent.notes,
        isMealPlan: partialEvent.isMealPlan,
        mealType: partialEvent.mealType,
        recipeId: partialEvent.recipeId,
        recipeTitle: partialEvent.recipeTitle
      };
      setEvents([...events, newEvt]);
    }
  };

  const handleDeleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id));
  };

  // --- PANTRY HANDLERS ---
  const handleSavePantryItem = (partialItem: Partial<PantryItem>) => {
    if (partialItem.id) {
      setPantry(pantry.map(p => p.id === partialItem.id ? { ...p, ...partialItem } as PantryItem : p));
    } else {
      const newItem: PantryItem = {
        id: `p-${Date.now()}`,
        name: partialItem.name || 'New Item',
        category: partialItem.category || 'Produce',
        quantity: partialItem.quantity ?? 1,
        unit: partialItem.unit || 'pcs',
        status: partialItem.status || 'in_stock',
        expiryDate: partialItem.expiryDate,
        notes: partialItem.notes,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setPantry([...pantry, newItem]);
    }
  };

  const handleDeletePantryItem = (id: string) => {
    setPantry(pantry.filter(p => p.id !== id));
  };

  const handleClearAllPantry = () => {
    setPantry([]);
  };

  const handleUpdatePantryQuantity = (id: string, delta: number) => {
    setPantry(pantry.map(p => {
      if (p.id === id) {
        const newQty = Math.max(0, p.quantity + delta);
        let newStatus: PantryItem['status'] = p.status;
        if (newQty === 0) newStatus = 'out_of_stock';
        else if (newQty <= 1) newStatus = 'running_low';
        else newStatus = 'in_stock';
        return { ...p, quantity: newQty, status: newStatus, updatedAt: todayStr };
      }
      return p;
    }));
  };

  const handleSyncLowPantryToShopping = (itemsToSync: PantryItem[]) => {
    const existingNames = shoppingList.map(s => s.name.toLowerCase());
    const newItems: ShoppingItem[] = [];

    itemsToSync.forEach(item => {
      if (!existingNames.includes(item.name.toLowerCase())) {
        newItems.push({
          id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: item.name,
          category: item.category,
          quantity: item.quantity === 0 ? '1' : `${item.quantity} ${item.unit}`,
          urgent: item.status === 'out_of_stock',
          isCompleted: false,
          sourcePantryItemId: item.id,
          createdAt: todayStr
        });
      }
    });

    if (newItems.length > 0) {
      setShoppingList([...shoppingList, ...newItems]);
      setActiveTab('shopping');
    }
  };

  const handleAddParsedPantryItems = (parsedItems: Partial<PantryItem>[]) => {
    const created: PantryItem[] = parsedItems.map((p, idx) => ({
      id: `p-${Date.now()}-${idx}`,
      name: p.name || 'Grocery Item',
      category: p.category || 'Pantry & Grains',
      quantity: p.quantity ?? 1,
      unit: p.unit || 'pcs',
      status: 'in_stock',
      updatedAt: todayStr
    }));

    setPantry([...pantry, ...created]);
  };

  // --- RECIPE & MEAL PLANNER HANDLERS ---
  const handleAddMissingToShoppingList = (missingIngredients: { name: string; amount: string }[], recipeTitle: string) => {
    const existingNames = shoppingList.map(s => s.name.toLowerCase());
    const added: ShoppingItem[] = [];

    missingIngredients.forEach(ing => {
      if (!existingNames.includes(ing.name.toLowerCase())) {
        added.push({
          id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: ing.name,
          category: 'Pantry & Grains',
          quantity: ing.amount,
          urgent: true,
          isCompleted: false,
          sourceRecipeTitle: recipeTitle,
          createdAt: todayStr
        });
      }
    });

    if (added.length > 0) {
      setShoppingList([...shoppingList, ...added]);
      setActiveTab('shopping');
    }
  };

  const handleSaveNewAiRecipes = (newRecipes: Recipe[]) => {
    setRecipes([...newRecipes, ...recipes]);
  };

  const handleConfirmScheduleMeal = (recipeId: string, date: string, mealType: 'breakfast' | 'lunch' | 'dinner', memberIds: string[]) => {
    const rec = recipes.find(r => r.id === recipeId);
    if (!rec) return;

    const newEvt: CalendarEvent = {
      id: `evt-meal-${Date.now()}`,
      title: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}: ${rec.title}`,
      memberIds: memberIds.length > 0 ? memberIds : members.map(m => m.id),
      date,
      startTime: mealType === 'breakfast' ? '08:00' : mealType === 'lunch' ? '12:30' : '18:30',
      endTime: mealType === 'breakfast' ? '08:45' : mealType === 'lunch' ? '13:15' : '19:30',
      category: 'meals',
      isMealPlan: true,
      mealType,
      recipeId: rec.id,
      recipeTitle: rec.title,
      notes: `Ingredients: ${rec.ingredients.map(i => i.name).join(', ')}`
    };

    setEvents([...events, newEvt]);
    setActiveTab('calendar');
  };

  // --- SHOPPING LIST HANDLERS ---
  const handleToggleShoppingItem = (id: string) => {
    setShoppingList(shoppingList.map(s => s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
  };

  const handleDeleteShoppingItem = (id: string) => {
    setShoppingList(shoppingList.filter(s => s.id !== id));
  };

  const handleAddShoppingItem = (itemData: Partial<ShoppingItem>) => {
    const newItem: ShoppingItem = {
      id: `shop-${Date.now()}`,
      name: itemData.name || 'Shopping Item',
      category: itemData.category || 'Produce',
      quantity: itemData.quantity || '1',
      urgent: !!itemData.urgent,
      assignedToMemberId: itemData.assignedToMemberId,
      isCompleted: false,
      createdAt: todayStr
    };
    setShoppingList([newItem, ...shoppingList]);
  };

  const handleRestockCheckedToPantry = () => {
    const completed = shoppingList.filter(s => s.isCompleted);
    if (completed.length === 0) return;

    // Update matching pantry items back to in_stock
    const updatedPantry = [...pantry];
    completed.forEach(c => {
      const existing = updatedPantry.find(p => p.name.toLowerCase() === c.name.toLowerCase());
      if (existing) {
        existing.status = 'in_stock';
        existing.quantity = Math.max(1, existing.quantity + 1);
        existing.updatedAt = todayStr;
      } else {
        updatedPantry.push({
          id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          name: c.name,
          category: c.category,
          quantity: 1,
          unit: 'pcs',
          status: 'in_stock',
          updatedAt: todayStr
        });
      }
    });

    setPantry(updatedPantry);
    setShoppingList(shoppingList.filter(s => !s.isCompleted));
    setActiveTab('pantry');
  };

  const handleClearCompletedShopping = () => {
    setShoppingList(shoppingList.filter(s => !s.isCompleted));
  };

  // --- FAMILY MEMBER HANDLERS ---
  const handleAddMember = (m: Partial<FamilyMember>) => {
    const newM: FamilyMember = {
      id: `mem-${Date.now()}`,
      name: m.name || 'Family Member',
      role: m.role || 'Son',
      color: m.color || '#ec4899',
      bgClass: m.bgClass || 'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-950 dark:text-pink-200',
      badgeClass: m.badgeClass || 'bg-pink-600 text-white',
      dietaryNotes: m.dietaryNotes
    };
    setMembers([...members, newM]);
  };

  const handleEditMember = (updatedMember: FamilyMember) => {
    setMembers(members.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const handleDeleteMember = (id: string) => {
    if (members.length <= 1) return;
    setMembers(members.filter(m => m.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col antialiased">
      
      <AnnouncementBanner messages={houseAnnouncements} />

      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        syncConfig={syncConfig}
        onOpenConnectCalendar={() => setShowConnectModal(true)}
        onOpenAddEvent={() => {
          setEventToEdit(null);
          setEventDefaultDate(undefined);
          setShowAddEventModal(true);
        }}
        onOpenAddPantry={() => {
          setPantryToEdit(null);
          setShowAddPantryModal(true);
        }}
        onOpenAddChore={() => {
          setChoreToEdit(null);
          setShowAddChoreModal(true);
        }}
        lowPantryCount={lowPantryCount}
        shoppingPendingCount={shoppingPendingCount}
        todayEventsCount={todayEventsCount}
        pendingChoresCount={pendingChoresCount}
      />

      {cloudSyncError && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 text-xs font-bold text-center py-1.5 px-4">
          {cloudSyncError} Changes made now will save locally and won't appear on your other devices until reconnected.
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {activeTab === 'calendar' && (
          <CalendarView
            events={events}
            members={members}
            onAddEvent={() => {
              setEventToEdit(null);
              setEventDefaultDate(undefined);
              setShowAddEventModal(true);
            }}
            onEditEvent={(evt) => {
              setEventToEdit(evt);
              setShowAddEventModal(true);
            }}
            onDeleteEvent={handleDeleteEvent}
            onOpenMealPlanner={(dateStr) => {
              setEventDefaultDate(dateStr);
              setPreSelectedRecipe(null);
              setShowMealPlannerModal(true);
            }}
            onOpenConnectCalendar={() => setShowConnectModal(true)}
          />
        )}

        {activeTab === 'chores' && (
          <ChoresView
            chores={chores}
            members={members}
            onToggleChore={handleToggleChore}
            onAddChore={() => {
              setChoreToEdit(null);
              setShowAddChoreModal(true);
            }}
            onEditChore={(chore) => {
              setChoreToEdit(chore);
              setShowAddChoreModal(true);
            }}
            onDeleteChore={handleDeleteChore}
            onSyncChoresToCalendar={handleSyncChoresToCalendar}
            onRandomizeWeeklyChores={handleRandomizeWeeklyChores}
          />
        )}

        {activeTab === 'pantry' && (
          <PantryView
            pantry={pantry}
            onAddPantryItem={() => {
              setPantryToEdit(null);
              setShowAddPantryModal(true);
            }}
            onEditPantryItem={(item) => {
              setPantryToEdit(item);
              setShowAddPantryModal(true);
            }}
            onDeletePantryItem={handleDeletePantryItem}
            onClearAllPantry={handleClearAllPantry}
            onUpdateQuantity={handleUpdatePantryQuantity}
            onSyncToShoppingList={handleSyncLowPantryToShopping}
            onOpenSmartImport={() => setShowSmartImportModal(true)}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeView
            recipes={recipes}
            pantry={pantry}
            onScheduleMeal={(rec) => {
              setPreSelectedRecipe(rec);
              setShowMealPlannerModal(true);
            }}
            onAddMissingToShoppingList={handleAddMissingToShoppingList}
            onSaveNewAiRecipes={handleSaveNewAiRecipes}
          />
        )}

        {activeTab === 'shopping' && (
          <ShoppingListView
            shoppingList={shoppingList}
            members={members}
            onToggleItemComplete={handleToggleShoppingItem}
            onDeleteItem={handleDeleteShoppingItem}
            onAddShoppingItem={handleAddShoppingItem}
            onRestockToPantry={handleRestockCheckedToPantry}
            onClearCompleted={handleClearCompletedShopping}
          />
        )}

        {activeTab === 'members' && (
          <FamilyMembersView
            members={members}
            events={events}
            shoppingList={shoppingList}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>The Ruffs Family Hub & Recipe Center &copy; {new Date().getFullYear()}</span>
          <span>Color-coded family calendars, cleaning & chore schedules, smart pantry tracking, and Gemini AI meal planning</span>
        </div>
      </footer>

      {/* MODALS */}
      <ConnectCalendarModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        syncConfig={syncConfig}
        onUpdateSyncConfig={(newCfg) => setSyncConfig(newCfg)}
        onTriggerSyncNow={() => setSyncConfig({ ...syncConfig, lastSyncedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
      />

      <AddEventModal
        isOpen={showAddEventModal}
        onClose={() => setShowAddEventModal(false)}
        members={members}
        recipes={recipes}
        eventToEdit={eventToEdit}
        defaultDate={eventDefaultDate}
        onSaveEvent={handleSaveEvent}
      />

      <AddChoreModal
        isOpen={showAddChoreModal}
        onClose={() => setShowAddChoreModal(false)}
        choreToEdit={choreToEdit}
        onSave={handleSaveChore}
        members={members}
      />

      <AddPantryModal
        isOpen={showAddPantryModal}
        onClose={() => setShowAddPantryModal(false)}
        itemToEdit={pantryToEdit}
        onSaveItem={handleSavePantryItem}
      />

      <SmartImportPantryModal
        isOpen={showSmartImportModal}
        onClose={() => setShowSmartImportModal(false)}
        onAddParsedItems={handleAddParsedPantryItems}
      />

      <MealPlannerModal
        isOpen={showMealPlannerModal}
        onClose={() => setShowMealPlannerModal(false)}
        recipes={recipes}
        members={members}
        preSelectedRecipe={preSelectedRecipe}
        defaultDate={eventDefaultDate}
        onConfirmScheduleMeal={handleConfirmScheduleMeal}
      />

    </div>
  );
}

