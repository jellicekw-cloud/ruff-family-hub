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
import { RewardsView } from './components/RewardsView';
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
  ChoreItem,
  Reward,
  RewardRedemption
} from './types';
import { storageService } from './services/storageService';
import { celebrateChoreComplete, celebrateBigMilestone } from './utils/confetti';
import { WEEKLY_CHORE_POOL, AREA_CHECKLISTS, LAUNDRY_SCHEDULE } from './data/initialData';
import { isSupabaseConfigured } from './services/supabaseClient';
import {
  fetchPantryFromSupabase,
  syncPantryToSupabase,
  fetchShoppingListFromSupabase,
  syncShoppingListToSupabase,
  fetchFamilyMembersFromSupabase,
  syncFamilyMembersToSupabase,
  fetchEventsFromSupabase,
  syncEventsToSupabase,
  fetchChoresFromSupabase,
  syncChoresToSupabase,
  fetchRecipesFromSupabase,
  syncRecipesToSupabase,
  fetchRewardsFromSupabase,
  syncRewardsToSupabase,
  fetchRedemptionsFromSupabase,
  syncRedemptionsToSupabase
} from './services/supabaseSyncService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'chores' | 'pantry' | 'recipes' | 'shopping' | 'members' | 'rewards'>('calendar');

  // House-wide scrolling announcements. Add/remove strings here to update the ticker banner.
  const houseAnnouncements = [
    'Do Not Leave Clothes in the Laundry Room!'
  ];

  // Core Data States
  const [members, setMembers] = useState<FamilyMember[]>(() => storageService.getMembers());
  const [events, setEvents] = useState<CalendarEvent[]>(() => storageService.getEvents());
  const [chores, setChores] = useState<ChoreItem[]>(() => storageService.getChores());
  const [rewards, setRewards] = useState<Reward[]>(() => storageService.getRewards());
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>(() => storageService.getRedemptions());
  // Pantry & Shopping List are synced to Supabase (shared across devices, e.g. a family tablet + your phone).
  // Local state seeds from localStorage/initial data first, then gets replaced by the Supabase fetch on mount.
  const [pantry, setPantry] = useState<PantryItem[]>(() => storageService.getPantry());
  const [recipes, setRecipes] = useState<Recipe[]>(() => storageService.getRecipes());
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>(() => storageService.getShoppingList());
  const [syncConfig, setSyncConfig] = useState<SyncCalendarConfig>(() => storageService.getSyncConfig());
  // Cloud sync via Supabase. Was temporarily disabled while tracking down a
  // crash — root cause found and fixed (a missing Buffer polyfill in the Vite
  // build, unrelated to our own code or to Supabase itself). Re-enabled.
  const CLOUD_SYNC_ENABLED = true;

  const [isCloudDataLoaded, setIsCloudDataLoaded] = useState(!isSupabaseConfigured || !CLOUD_SYNC_ENABLED);
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
  useEffect(() => { storageService.saveSyncConfig(syncConfig); }, [syncConfig]);

  // One-time load of everything from Supabase (falls back to whatever was already
  // seeded from localStorage/initial data if Supabase isn't reachable).
  useEffect(() => {
    if (!isSupabaseConfigured || !CLOUD_SYNC_ENABLED) return;

    let cancelled = false;
    (async () => {
      try {
        const [
          cloudMembers, cloudPantry, cloudShopping,
          cloudEvents, cloudChores, cloudRecipes, cloudRewards, cloudRedemptions
        ] = await Promise.all([
          fetchFamilyMembersFromSupabase(),
          fetchPantryFromSupabase(),
          fetchShoppingListFromSupabase(),
          fetchEventsFromSupabase(),
          fetchChoresFromSupabase(),
          fetchRecipesFromSupabase(),
          fetchRewardsFromSupabase(),
          fetchRedemptionsFromSupabase()
        ]);
        if (cancelled) return;

        const allFailed = [cloudMembers, cloudPantry, cloudShopping, cloudEvents, cloudChores, cloudRecipes, cloudRewards, cloudRedemptions]
          .every(r => r === null);

        if (allFailed) {
          setCloudSyncError('Could not reach Supabase — using data saved on this device only.');
        } else {
          // Only adopt cloud data once it's actually been seeded. An empty cloud table
          // (first-ever sync) means "not seeded yet," not "delete everything" — in that
          // case we keep local data as-is and let the write-sync effects push it up instead.
          if (cloudMembers !== null && cloudMembers.length > 0) setMembers(cloudMembers);
          if (cloudPantry !== null) setPantry(cloudPantry);
          if (cloudShopping !== null) setShoppingList(cloudShopping);
          if (cloudEvents !== null && cloudEvents.length > 0) setEvents(cloudEvents);
          if (cloudChores !== null && cloudChores.length > 0) setChores(cloudChores);
          if (cloudRecipes !== null && cloudRecipes.length > 0) setRecipes(cloudRecipes);
          if (cloudRewards !== null && cloudRewards.length > 0) setRewards(cloudRewards);
          if (cloudRedemptions !== null && cloudRedemptions.length > 0) setRedemptions(cloudRedemptions);
        }
      } catch (err) {
        // A single failed/thrown request should never take down the whole app —
        // fall back to local-only data and let the person keep using it.
        console.error('Cloud data load failed:', err);
        if (!cancelled) setCloudSyncError('Could not reach Supabase — using data saved on this device only.');
      } finally {
        if (!cancelled) setIsCloudDataLoaded(true);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keeps Laundry Day events on the calendar automatically, always covering the
  // next 12 weeks — completely independent of the chore randomizer. Runs once per
  // app load; idempotent (checks what's already there before adding more), so it
  // just quietly tops up coverage over time without creating duplicates.
  useEffect(() => {
    if (!isCloudDataLoaded || members.length === 0) return;

    const existingIds = new Set(events.map(e => e.id));
    const newLaundryEvents: CalendarEvent[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizonDays = 84; // 12 weeks ahead

    for (let offset = 0; offset <= horizonDays; offset++) {
      const d = new Date(today);
      d.setDate(today.getDate() + offset);
      const dayOfWeek = d.getDay();
      const dateStr = d.toISOString().split('T')[0];

      const scheduleEntry = LAUNDRY_SCHEDULE.find(s => s.dayOfWeek === dayOfWeek);
      if (!scheduleEntry) continue;

      const memberIds = scheduleEntry.memberNames
        .map(name => members.find(m => m.name.toLowerCase() === name.toLowerCase())?.id)
        .filter((id): id is string => !!id);
      if (memberIds.length === 0) continue;

      const eventId = `evt-laundry-${dayOfWeek}-${dateStr}`;
      if (existingIds.has(eventId)) continue;

      const namesLabel = scheduleEntry.memberNames.join(' & ');
      newLaundryEvents.push({
        id: eventId,
        title: `🧺 Laundry Day — ${namesLabel}`,
        memberIds,
        date: dateStr,
        startTime: '09:00',
        endTime: '10:00',
        category: 'chores',
        notes: 'Fixed weekly laundry schedule'
      });
    }

    if (newLaundryEvents.length > 0) {
      setEvents(prev => [...prev, ...newLaundryEvents]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCloudDataLoaded, members.length]);

  // Family Members: cache locally always; push to Supabase once the initial cloud load has finished.
  useEffect(() => {
    storageService.saveMembers(members);
    if (!isCloudDataLoaded) return;
    syncFamilyMembersToSupabase(members).catch(err => console.error('Family members cloud sync failed:', err));
  }, [members, isCloudDataLoaded]);

  // Pantry: same cache-then-sync pattern.
  useEffect(() => {
    storageService.savePantry(pantry);
    if (!isCloudDataLoaded) return;
    syncPantryToSupabase(pantry).catch(err => console.error('Pantry cloud sync failed:', err));
  }, [pantry, isCloudDataLoaded]);

  // Shopping List: same pattern.
  useEffect(() => {
    storageService.saveShoppingList(shoppingList);
    if (!isCloudDataLoaded) return;
    syncShoppingListToSupabase(shoppingList).catch(err => console.error('Shopping list cloud sync failed:', err));
  }, [shoppingList, isCloudDataLoaded]);

  // Calendar Events: same pattern.
  useEffect(() => {
    storageService.saveEvents(events);
    if (!isCloudDataLoaded) return;
    syncEventsToSupabase(events).catch(err => console.error('Events cloud sync failed:', err));
  }, [events, isCloudDataLoaded]);

  // Chores: same pattern.
  useEffect(() => {
    storageService.saveChores(chores);
    if (!isCloudDataLoaded) return;
    syncChoresToSupabase(chores).catch(err => console.error('Chores cloud sync failed:', err));
  }, [chores, isCloudDataLoaded]);

  // Recipes: same pattern.
  useEffect(() => {
    storageService.saveRecipes(recipes);
    if (!isCloudDataLoaded) return;
    syncRecipesToSupabase(recipes).catch(err => console.error('Recipes cloud sync failed:', err));
  }, [recipes, isCloudDataLoaded]);

  // Rewards catalog: same pattern.
  useEffect(() => {
    storageService.saveRewards(rewards);
    if (!isCloudDataLoaded) return;
    syncRewardsToSupabase(rewards).catch(err => console.error('Rewards cloud sync failed:', err));
  }, [rewards, isCloudDataLoaded]);

  // Reward Redemptions: same pattern.
  useEffect(() => {
    storageService.saveRedemptions(redemptions);
    if (!isCloudDataLoaded) return;
    syncRedemptionsToSupabase(redemptions).catch(err => console.error('Redemptions cloud sync failed:', err));
  }, [redemptions, isCloudDataLoaded]);

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

  // For daily-tracked chores (ones with weekStartDate — the 6 rotating areas):
  // toggles a single day within that week's checklist on/off. The chore is only
  // considered fully "isCompleted" once every day from weekStartDate to dueDate is checked.
  const handleToggleChoreDay = (choreId: string, dateStr: string) => {
    const target = chores.find(c => c.id === choreId);
    if (!target || !target.weekStartDate) return;

    const currentDates = target.completedDates || [];
    const isCurrentlyDone = currentDates.includes(dateStr);
    const nextDates = isCurrentlyDone
      ? currentDates.filter(d => d !== dateStr)
      : [...currentDates, dateStr];

    // Total days in this chore's active week (inclusive of both ends)
    const start = new Date(target.weekStartDate + 'T00:00:00');
    const end = new Date(target.dueDate + 'T00:00:00');
    const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const nowFullyComplete = nextDates.length >= totalDays;

    setChores(chores.map(c =>
      c.id === choreId
        ? { ...c, completedDates: nextDates, isCompleted: nowFullyComplete, completedAt: nowFullyComplete ? todayStr : undefined }
        : c
    ));

    if (!isCurrentlyDone) {
      // Marking a day done (not un-marking) — celebrate. Bigger burst if this
      // was the last remaining day across ALL chores for the week.
      const remainingAfterThis = chores.some(c => {
        if (c.id === choreId) return !nowFullyComplete;
        return !c.isCompleted;
      });
      if (!remainingAfterThis) {
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

    // You randomize every Sunday, so "this week" runs Sunday → Saturday,
    // and every chore assigned this round shares the same Saturday deadline.
    const now = new Date();
    const day = now.getDay(); // 0 = Sun ... 6 = Sat
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - day);
    sunday.setHours(0, 0, 0, 0);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);

    const weekStart = sunday.toISOString().split('T')[0];
    const weekEnd = saturday.toISOString().split('T')[0]; // the shared deadline for every chore this round

    // Clear out any previously-randomized chores for this same week so re-rolling doesn't duplicate
    // (both the rotating area chores AND the fixed laundry day chores)
    const poolTitles = new Set(WEEKLY_CHORE_POOL.map(p => p.title));
    const keptChores = chores.filter(c => {
      const isThisWeekRandomized = (poolTitles.has(c.title) || c.area === 'Laundry Day') && c.dueDate >= weekStart && c.dueDate <= weekEnd;
      return !isThisWeekRandomized;
    });

    // Permanently excluded from chores (e.g. lives out of town) — never eligible, regardless of Away status
    const eligibleMembers = members.filter(m => !m.excludeFromChores);

    if (eligibleMembers.length === 0) {
      alert('Everyone is set to "Skip in Chore Rotation" — edit at least one family member to include them before randomizing.');
      return;
    }

    // Skip anyone marked "Away" on the calendar for any part of this week (vacations, trips, etc)
    const awayMemberIds = new Set(
      events
        .filter(e => e.isAway && e.date <= weekEnd && (e.endDate || e.date) >= weekStart)
        .flatMap(e => e.memberIds)
    );
    const availableMembers = eligibleMembers.filter(m => !awayMemberIds.has(m.id));
    const awayMembersThisWeek = eligibleMembers.filter(m => awayMemberIds.has(m.id));

    // If literally everyone eligible is away, fall back to assigning across all
    // eligible members anyway — but never fall back to someone permanently excluded.
    const assignPool = availableMembers.length > 0 ? availableMembers : eligibleMembers;

    // Shuffle family members so ties break differently each time
    const shuffledMembers = [...assignPool].sort(() => Math.random() - 0.5);

    // Balance real workload, not just "one area per person": heaviest areas
    // (by actual checklist task count) get assigned first, always to whoever
    // currently has the least total work — classic greedy load-balancing.
    const areasByWeight = [...WEEKLY_CHORE_POOL].sort(
      (a, b) => AREA_CHECKLISTS[b.area].length - AREA_CHECKLISTS[a.area].length
    );

    const memberLoad: Record<string, number> = {};
    shuffledMembers.forEach(m => { memberLoad[m.id] = 0; });

    const assignments = areasByWeight.map(preset => {
      const minLoad = Math.min(...shuffledMembers.map(m => memberLoad[m.id]));
      const candidates = shuffledMembers.filter(m => memberLoad[m.id] === minLoad);
      const chosen = candidates[Math.floor(Math.random() * candidates.length)];
      memberLoad[chosen.id] += AREA_CHECKLISTS[preset.area].length;
      return { preset, memberId: chosen.id };
    });

    const newChores: ChoreItem[] = assignments.map(({ preset, memberId }, idx) => ({
      id: `chore-rand-${Date.now()}-${idx}`,
      title: preset.title,
      area: preset.area,
      assignedMemberId: memberId,
      frequency: 'Weekly',
      dueDate: weekEnd,
      weekStartDate: weekStart, // marks this as a daily-tracked chore (Sun–Sat checklist)
      isCompleted: false,
      completedDates: [],
      priority: 'Medium',
      points: preset.points
    }));

    // Fixed laundry day assignments — never randomized, always the same people
    // on the same days. These are single-day chores (not daily-tracked).
    const laundryChores: ChoreItem[] = [];
    LAUNDRY_SCHEDULE.forEach((entry, scheduleIdx) => {
      const laundryDate = new Date(sunday);
      laundryDate.setDate(sunday.getDate() + entry.dayOfWeek);
      const laundryDateStr = laundryDate.toISOString().split('T')[0];

      entry.memberNames.forEach((name, nameIdx) => {
        const member = members.find(m => m.name.toLowerCase() === name.toLowerCase());
        if (!member) return; // name not found among current family members — skip silently
        laundryChores.push({
          id: `chore-laundry-${Date.now()}-${scheduleIdx}-${nameIdx}`,
          title: 'Laundry Day',
          area: 'Laundry Day',
          assignedMemberId: member.id,
          frequency: 'Weekly',
          dueDate: laundryDateStr,
          isCompleted: false,
          priority: 'Medium',
          points: 15
        });
      });
    });

    setChores([...keptChores, ...newChores, ...laundryChores]);
    setActiveTab('chores');

    // Group flat area assignments by member so each person gets ONE notification
    // listing everything they were assigned, not one text per area.
    const byMember: Record<string, { areas: string[]; totalTasks: number }> = {};
    newChores.forEach(c => {
      if (!c.assignedMemberId) return;
      if (!byMember[c.assignedMemberId]) {
        byMember[c.assignedMemberId] = { areas: [], totalTasks: 0 };
      }
      byMember[c.assignedMemberId].areas.push(c.area);
      byMember[c.assignedMemberId].totalTasks += AREA_CHECKLISTS[c.area].length;
    });

    const deadlineLabel = saturday.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });

    const pushAssignments = Object.entries(byMember).map(([memberId, info]) => ({
      memberId,
      memberName: members.find(m => m.id === memberId)?.name || 'Someone',
      areas: info.areas,
      totalTasks: info.totalTasks,
      dueDateLabel: deadlineLabel
    }));

    // Fire-and-forget: chore reminder push notifications shouldn't block the UI
    // or fail loudly if nobody's enabled notifications on their device yet.
    fetch('/api/send-chore-notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignments: pushAssignments })
    }).catch(err => console.error('Chore notification push failed:', err));

    const summary = newChores
      .map(c => `${members.find(m => m.id === c.assignedMemberId)?.name || 'Someone'} → ${c.area} (${AREA_CHECKLISTS[c.area].length} tasks/day)`)
      .join('\n');
    const laundrySummary = laundryChores
      .map(c => `${members.find(m => m.id === c.assignedMemberId)?.name || '?'} — ${new Date(c.dueDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })}`)
      .join(', ');
    const awayNote = awayMembersThisWeek.length > 0
      ? `\n\n✈️ Skipped this week (marked Away): ${awayMembersThisWeek.map(m => m.name).join(', ')}`
      : '';
    alert(`🎲 This week's chores are randomized (balanced by workload)!\n\n${summary}\n\n🧺 Laundry Day: ${laundrySummary}${awayNote}`);
  };

  // --- REWARDS HANDLERS ---
  const handleRedeemReward = (memberId: string, reward: Reward) => {
    const newRedemption: RewardRedemption = {
      id: `redeem-${Date.now()}`,
      memberId,
      rewardId: reward.id,
      rewardTitle: reward.title,
      pointsCost: reward.pointsCost,
      redeemedAt: new Date().toISOString(),
      status: 'pending'
    };
    setRedemptions([...redemptions, newRedemption]);
    celebrateChoreComplete();

    const member = members.find(m => m.id === memberId);

    // Fire-and-forget: don't let a failed email block the redemption itself
    fetch('/api/notify-redemption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        memberName: member?.name || 'Someone',
        rewardTitle: reward.title,
        pointsCost: reward.pointsCost,
        emoji: reward.emoji
      })
    }).catch(err => console.error('Redemption notification email failed:', err));

    alert(`${reward.emoji || '🎁'} ${member?.name || 'You'} redeemed "${reward.title}" for ${reward.pointsCost} points!\n\nThis is now pending — check the Rewards tab to mark it as given once handed over.`);
  };

  const handleFulfillRedemption = (redemptionId: string) => {
    setRedemptions(redemptions.map(r =>
      r.id === redemptionId
        ? { ...r, status: 'fulfilled' as const, fulfilledAt: new Date().toISOString() }
        : r
    ));
  };

  const handleAddReward = (reward: Reward) => {
    setRewards([...rewards, reward]);
  };

  const handleDeleteReward = (rewardId: string) => {
    setRewards(rewards.filter(r => r.id !== rewardId));
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
        endDate: partialEvent.endDate,
        isAway: partialEvent.isAway,
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

      // Broadcast to everyone who's enabled notifications — fire-and-forget,
      // shouldn't block the UI or fail loudly if nobody's subscribed yet.
      const memberNames = newEvt.memberIds
        .map(id => members.find(m => m.id === id)?.name)
        .filter(Boolean)
        .join(', ');
      const eventDateLabel = new Date(newEvt.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });

      fetch('/api/send-event-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newEvt.title,
          dateLabel: eventDateLabel,
          memberNames: memberNames || 'the family',
          category: newEvt.category
        })
      }).catch(err => console.error('Event notification push failed:', err));
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
        updatedAt: new Date().toISOString().split('T')[0],
        barcode: partialItem.barcode
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
      dietaryNotes: m.dietaryNotes,
      excludeFromChores: m.excludeFromChores
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
        pendingRewardsCount={redemptions.filter(r => r.status === 'pending').length}
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
            onToggleChoreDay={handleToggleChoreDay}
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
            onSaveScannedItem={handleSavePantryItem}
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

        {activeTab === 'rewards' && (
          <RewardsView
            members={members}
            chores={chores}
            rewards={rewards}
            redemptions={redemptions}
            onRedeem={handleRedeemReward}
            onAddReward={handleAddReward}
            onDeleteReward={handleDeleteReward}
            onFulfillRedemption={handleFulfillRedemption}
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

