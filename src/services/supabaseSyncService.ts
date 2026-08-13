import { PantryItem, ShoppingItem, CategoryType } from '../types';
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
