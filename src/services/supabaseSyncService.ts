import { PantryItem, ShoppingItem, CategoryType, FamilyMember, CalendarEvent, EventCategory, ChoreItem, ChoreArea, ChoreFrequency, Recipe, Reward, RewardRedemption } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// --- Row shapes (snake_case, matching the SQL schema) ---

interface PantryRow {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
  expiry_date: string | null;
  notes: string | null;
  updated_at: string;
  barcode: string | null;
}

interface ShoppingRow {
  id: string;
  name: string;
  category: string;
  quantity: string;
  added_by_member_id: string | null;
  assigned_to_member_id: string | null;
  is_completed: boolean;
  urgent: boolean;
  source_pantry_item_id: string | null;
  source_recipe_title: string | null;
  created_at: string;
}

// --- Mappers ---

const pantryToRow = (p: PantryItem): PantryRow => ({
  id: p.id,
  name: p.name,
  category: p.category,
  quantity: p.quantity,
  unit: p.unit,
  status: p.status,
  expiry_date: p.expiryDate || null,
  notes: p.notes || null,
  updated_at: p.updatedAt,
  barcode: p.barcode || null,
});

const rowToPantry = (r: PantryRow): PantryItem => ({
  id: r.id,
  name: r.name,
  category: r.category as CategoryType,
  quantity: r.quantity,
  unit: r.unit,
  status: r.status as PantryItem['status'],
  expiryDate: r.expiry_date || undefined,
  notes: r.notes || undefined,
  updatedAt: r.updated_at,
  barcode: r.barcode || undefined,
});

const shoppingToRow = (s: ShoppingItem): ShoppingRow => ({
  id: s.id,
  name: s.name,
  category: s.category,
  quantity: s.quantity,
  added_by_member_id: s.addedByMemberId || null,
  assigned_to_member_id: s.assignedToMemberId || null,
  is_completed: s.isCompleted,
  urgent: s.urgent,
  source_pantry_item_id: s.sourcePantryItemId || null,
  source_recipe_title: s.sourceRecipeTitle || null,
  created_at: s.createdAt,
});

const rowToShopping = (r: ShoppingRow): ShoppingItem => ({
  id: r.id,
  name: r.name,
  category: r.category as CategoryType,
  quantity: r.quantity,
  addedByMemberId: r.added_by_member_id || undefined,
  assignedToMemberId: r.assigned_to_member_id || undefined,
  isCompleted: r.is_completed,
  urgent: r.urgent,
  sourcePantryItemId: r.source_pantry_item_id || undefined,
  sourceRecipeTitle: r.source_recipe_title || undefined,
  createdAt: r.created_at,
});

// --- Pantry ---

export async function fetchPantryFromSupabase(): Promise<PantryItem[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('pantry_items').select('*').order('name');
  if (error) {
    console.error('Supabase fetchPantry error:', error.message);
    return null;
  }
  return (data as PantryRow[]).map(rowToPantry);
}

export async function syncPantryToSupabase(items: PantryItem[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: existing, error: fetchErr } = await supabase.from('pantry_items').select('id');
  if (fetchErr) {
    console.error('Supabase pantry pre-sync fetch error:', fetchErr.message);
    return;
  }

  const currentIds = new Set(items.map(i => i.id));
  const staleIds = (existing || []).map(r => r.id).filter((id: string) => !currentIds.has(id));

  if (staleIds.length > 0) {
    const { error: delErr } = await supabase.from('pantry_items').delete().in('id', staleIds);
    if (delErr) console.error('Supabase pantry delete error:', delErr.message);
  }

  if (items.length > 0) {
    const { error: upsertErr } = await supabase.from('pantry_items').upsert(items.map(pantryToRow));
    if (upsertErr) console.error('Supabase pantry upsert error:', upsertErr.message);
  }
}

// --- Shopping List ---

export async function fetchShoppingListFromSupabase(): Promise<ShoppingItem[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('shopping_items').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Supabase fetchShoppingList error:', error.message);
    return null;
  }
  return (data as ShoppingRow[]).map(rowToShopping);
}

export async function syncShoppingListToSupabase(items: ShoppingItem[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: existing, error: fetchErr } = await supabase.from('shopping_items').select('id');
  if (fetchErr) {
    console.error('Supabase shopping pre-sync fetch error:', fetchErr.message);
    return;
  }

  const currentIds = new Set(items.map(i => i.id));
  const staleIds = (existing || []).map(r => r.id).filter((id: string) => !currentIds.has(id));

  if (staleIds.length > 0) {
    const { error: delErr } = await supabase.from('shopping_items').delete().in('id', staleIds);
    if (delErr) console.error('Supabase shopping delete error:', delErr.message);
  }

  if (items.length > 0) {
    const { error: upsertErr } = await supabase.from('shopping_items').upsert(items.map(shoppingToRow));
    if (upsertErr) console.error('Supabase shopping upsert error:', upsertErr.message);
  }
}

// --- Family Members ---

interface FamilyMemberRow {
  id: string;
  name: string;
  role: string;
  color: string;
  bg_class: string;
  badge_class: string;
  avatar_icon: string | null;
  dietary_notes: string | null;
  sort_order: number;
}

const memberToRow = (m: FamilyMember, sortOrder: number): FamilyMemberRow => ({
  id: m.id,
  name: m.name,
  role: m.role,
  color: m.color,
  bg_class: m.bgClass,
  badge_class: m.badgeClass,
  avatar_icon: m.avatarIcon || null,
  dietary_notes: m.dietaryNotes || null,
  sort_order: sortOrder,
});

const rowToMember = (r: FamilyMemberRow): FamilyMember => ({
  id: r.id,
  name: r.name,
  role: r.role as FamilyMember['role'],
  color: r.color,
  bgClass: r.bg_class,
  badgeClass: r.badge_class,
  avatarIcon: r.avatar_icon || undefined,
  dietaryNotes: r.dietary_notes || undefined,
});

export async function fetchFamilyMembersFromSupabase(): Promise<FamilyMember[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('family_members').select('*').order('sort_order');
  if (error) {
    console.error('Supabase fetchFamilyMembers error:', error.message);
    return null;
  }
  return (data as FamilyMemberRow[]).map(rowToMember);
}

export async function syncFamilyMembersToSupabase(members: FamilyMember[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: existing, error: fetchErr } = await supabase.from('family_members').select('id');
  if (fetchErr) {
    console.error('Supabase family members pre-sync fetch error:', fetchErr.message);
    return;
  }

  const currentIds = new Set(members.map(m => m.id));
  const staleIds = (existing || []).map(r => r.id).filter((id: string) => !currentIds.has(id));

  if (staleIds.length > 0) {
    const { error: delErr } = await supabase.from('family_members').delete().in('id', staleIds);
    if (delErr) console.error('Supabase family members delete error:', delErr.message);
  }

  if (members.length > 0) {
    const rows = members.map((m, idx) => memberToRow(m, idx));
    const { error: upsertErr } = await supabase.from('family_members').upsert(rows);
    if (upsertErr) console.error('Supabase family members upsert error:', upsertErr.message);
  }
}

// --- Calendar Events ---

interface CalendarEventRow {
  id: string;
  title: string;
  member_ids: string[];
  date: string;
  end_date: string | null;
  is_away: boolean;
  start_time: string;
  end_time: string;
  category: string;
  location: string | null;
  notes: string | null;
  is_meal_plan: boolean;
  meal_type: string | null;
  recipe_id: string | null;
  recipe_title: string | null;
}

const eventToRow = (e: CalendarEvent): CalendarEventRow => ({
  id: e.id,
  title: e.title,
  member_ids: e.memberIds,
  date: e.date,
  end_date: e.endDate || null,
  is_away: !!e.isAway,
  start_time: e.startTime,
  end_time: e.endTime,
  category: e.category,
  location: e.location || null,
  notes: e.notes || null,
  is_meal_plan: !!e.isMealPlan,
  meal_type: e.mealType || null,
  recipe_id: e.recipeId || null,
  recipe_title: e.recipeTitle || null,
});

const rowToEvent = (r: CalendarEventRow): CalendarEvent => ({
  id: r.id,
  title: r.title,
  memberIds: r.member_ids || [],
  date: r.date,
  endDate: r.end_date || undefined,
  isAway: r.is_away || undefined,
  startTime: r.start_time,
  endTime: r.end_time,
  category: r.category as EventCategory,
  location: r.location || undefined,
  notes: r.notes || undefined,
  isMealPlan: r.is_meal_plan || undefined,
  mealType: (r.meal_type as CalendarEvent['mealType']) || undefined,
  recipeId: r.recipe_id || undefined,
  recipeTitle: r.recipe_title || undefined,
});

export async function fetchEventsFromSupabase(): Promise<CalendarEvent[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('calendar_events').select('*').order('date');
  if (error) {
    console.error('Supabase fetchEvents error:', error.message);
    return null;
  }
  return (data as CalendarEventRow[]).map(rowToEvent);
}

export async function syncEventsToSupabase(events: CalendarEvent[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: existing, error: fetchErr } = await supabase.from('calendar_events').select('id');
  if (fetchErr) {
    console.error('Supabase events pre-sync fetch error:', fetchErr.message);
    return;
  }

  const currentIds = new Set(events.map(e => e.id));
  const staleIds = (existing || []).map(r => r.id).filter((id: string) => !currentIds.has(id));

  if (staleIds.length > 0) {
    const { error: delErr } = await supabase.from('calendar_events').delete().in('id', staleIds);
    if (delErr) console.error('Supabase events delete error:', delErr.message);
  }

  if (events.length > 0) {
    const { error: upsertErr } = await supabase.from('calendar_events').upsert(events.map(eventToRow));
    if (upsertErr) console.error('Supabase events upsert error:', upsertErr.message);
  }
}

// --- Chores ---

interface ChoreRow {
  id: string;
  title: string;
  area: string;
  assigned_member_id: string | null;
  frequency: string;
  due_date: string;
  is_completed: boolean;
  completed_at: string | null;
  priority: string;
  points: number;
  notes: string | null;
}

const choreToRow = (c: ChoreItem): ChoreRow => ({
  id: c.id,
  title: c.title,
  area: c.area,
  assigned_member_id: c.assignedMemberId || null,
  frequency: c.frequency,
  due_date: c.dueDate,
  is_completed: c.isCompleted,
  completed_at: c.completedAt || null,
  priority: c.priority,
  points: c.points,
  notes: c.notes || null,
});

const rowToChore = (r: ChoreRow): ChoreItem => ({
  id: r.id,
  title: r.title,
  area: r.area as ChoreArea,
  assignedMemberId: r.assigned_member_id || undefined,
  frequency: r.frequency as ChoreFrequency,
  dueDate: r.due_date,
  isCompleted: r.is_completed,
  completedAt: r.completed_at || undefined,
  priority: r.priority as ChoreItem['priority'],
  points: r.points,
  notes: r.notes || undefined,
});

export async function fetchChoresFromSupabase(): Promise<ChoreItem[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('chores').select('*').order('due_date');
  if (error) {
    console.error('Supabase fetchChores error:', error.message);
    return null;
  }
  return (data as ChoreRow[]).map(rowToChore);
}

export async function syncChoresToSupabase(chores: ChoreItem[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: existing, error: fetchErr } = await supabase.from('chores').select('id');
  if (fetchErr) {
    console.error('Supabase chores pre-sync fetch error:', fetchErr.message);
    return;
  }

  const currentIds = new Set(chores.map(c => c.id));
  const staleIds = (existing || []).map(r => r.id).filter((id: string) => !currentIds.has(id));

  if (staleIds.length > 0) {
    const { error: delErr } = await supabase.from('chores').delete().in('id', staleIds);
    if (delErr) console.error('Supabase chores delete error:', delErr.message);
  }

  if (chores.length > 0) {
    const { error: upsertErr } = await supabase.from('chores').upsert(chores.map(choreToRow));
    if (upsertErr) console.error('Supabase chores upsert error:', upsertErr.message);
  }
}

// --- Recipes ---

interface RecipeRow {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  category: string;
  difficulty: string;
  ingredients: any;
  instructions: any;
  is_favorite: boolean | null;
  tags: string[];
  calories: number | null;
  source: string | null;
  image_url: string | null;
}

const recipeToRow = (r: Recipe): RecipeRow => ({
  id: r.id,
  title: r.title,
  description: r.description,
  prep_time: r.prepTime,
  cook_time: r.cookTime,
  servings: r.servings,
  category: r.category,
  difficulty: r.difficulty,
  ingredients: r.ingredients,
  instructions: r.instructions,
  is_favorite: r.isFavorite ?? null,
  tags: r.tags,
  calories: r.calories ?? null,
  source: r.source || null,
  image_url: r.imageUrl || null,
});

const rowToRecipe = (r: RecipeRow): Recipe => ({
  id: r.id,
  title: r.title,
  description: r.description,
  prepTime: r.prep_time,
  cookTime: r.cook_time,
  servings: r.servings,
  category: r.category,
  difficulty: r.difficulty as Recipe['difficulty'],
  ingredients: r.ingredients || [],
  instructions: r.instructions || [],
  isFavorite: r.is_favorite ?? undefined,
  tags: r.tags || [],
  calories: r.calories ?? undefined,
  source: (r.source as Recipe['source']) || undefined,
  imageUrl: r.image_url || undefined,
});

export async function fetchRecipesFromSupabase(): Promise<Recipe[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('recipes').select('*');
  if (error) {
    console.error('Supabase fetchRecipes error:', error.message);
    return null;
  }
  return (data as RecipeRow[]).map(rowToRecipe);
}

export async function syncRecipesToSupabase(recipes: Recipe[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: existing, error: fetchErr } = await supabase.from('recipes').select('id');
  if (fetchErr) {
    console.error('Supabase recipes pre-sync fetch error:', fetchErr.message);
    return;
  }

  const currentIds = new Set(recipes.map(r => r.id));
  const staleIds = (existing || []).map(r => r.id).filter((id: string) => !currentIds.has(id));

  if (staleIds.length > 0) {
    const { error: delErr } = await supabase.from('recipes').delete().in('id', staleIds);
    if (delErr) console.error('Supabase recipes delete error:', delErr.message);
  }

  if (recipes.length > 0) {
    const { error: upsertErr } = await supabase.from('recipes').upsert(recipes.map(recipeToRow));
    if (upsertErr) console.error('Supabase recipes upsert error:', upsertErr.message);
  }
}

// --- Rewards ---

interface RewardRow {
  id: string;
  title: string;
  description: string | null;
  points_cost: number;
  emoji: string | null;
}

const rewardToRow = (r: Reward): RewardRow => ({
  id: r.id,
  title: r.title,
  description: r.description || null,
  points_cost: r.pointsCost,
  emoji: r.emoji || null,
});

const rowToReward = (r: RewardRow): Reward => ({
  id: r.id,
  title: r.title,
  description: r.description || undefined,
  pointsCost: r.points_cost,
  emoji: r.emoji || undefined,
});

export async function fetchRewardsFromSupabase(): Promise<Reward[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('rewards').select('*');
  if (error) {
    console.error('Supabase fetchRewards error:', error.message);
    return null;
  }
  return (data as RewardRow[]).map(rowToReward);
}

export async function syncRewardsToSupabase(rewards: Reward[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: existing, error: fetchErr } = await supabase.from('rewards').select('id');
  if (fetchErr) {
    console.error('Supabase rewards pre-sync fetch error:', fetchErr.message);
    return;
  }

  const currentIds = new Set(rewards.map(r => r.id));
  const staleIds = (existing || []).map(r => r.id).filter((id: string) => !currentIds.has(id));

  if (staleIds.length > 0) {
    const { error: delErr } = await supabase.from('rewards').delete().in('id', staleIds);
    if (delErr) console.error('Supabase rewards delete error:', delErr.message);
  }

  if (rewards.length > 0) {
    const { error: upsertErr } = await supabase.from('rewards').upsert(rewards.map(rewardToRow));
    if (upsertErr) console.error('Supabase rewards upsert error:', upsertErr.message);
  }
}

// --- Reward Redemptions ---

interface RedemptionRow {
  id: string;
  member_id: string;
  reward_id: string;
  reward_title: string;
  points_cost: number;
  redeemed_at: string;
  status: string;
  fulfilled_at: string | null;
}

const redemptionToRow = (r: RewardRedemption): RedemptionRow => ({
  id: r.id,
  member_id: r.memberId,
  reward_id: r.rewardId,
  reward_title: r.rewardTitle,
  points_cost: r.pointsCost,
  redeemed_at: r.redeemedAt,
  status: r.status,
  fulfilled_at: r.fulfilledAt || null,
});

const rowToRedemption = (r: RedemptionRow): RewardRedemption => ({
  id: r.id,
  memberId: r.member_id,
  rewardId: r.reward_id,
  rewardTitle: r.reward_title,
  pointsCost: r.points_cost,
  redeemedAt: r.redeemed_at,
  status: r.status as RewardRedemption['status'],
  fulfilledAt: r.fulfilled_at || undefined,
});

export async function fetchRedemptionsFromSupabase(): Promise<RewardRedemption[] | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.from('reward_redemptions').select('*').order('redeemed_at', { ascending: false });
  if (error) {
    console.error('Supabase fetchRedemptions error:', error.message);
    return null;
  }
  return (data as RedemptionRow[]).map(rowToRedemption);
}

export async function syncRedemptionsToSupabase(redemptions: RewardRedemption[]): Promise<void> {
  if (!isSupabaseConfigured) return;

  const { data: existing, error: fetchErr } = await supabase.from('reward_redemptions').select('id');
  if (fetchErr) {
    console.error('Supabase redemptions pre-sync fetch error:', fetchErr.message);
    return;
  }

  const currentIds = new Set(redemptions.map(r => r.id));
  const staleIds = (existing || []).map(r => r.id).filter((id: string) => !currentIds.has(id));

  if (staleIds.length > 0) {
    const { error: delErr } = await supabase.from('reward_redemptions').delete().in('id', staleIds);
    if (delErr) console.error('Supabase redemptions delete error:', delErr.message);
  }

  if (redemptions.length > 0) {
    const { error: upsertErr } = await supabase.from('reward_redemptions').upsert(redemptions.map(redemptionToRow));
    if (upsertErr) console.error('Supabase redemptions upsert error:', upsertErr.message);
  }
}

