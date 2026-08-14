export type CategoryType = 
  | 'Produce' 
  | 'Dairy & Eggs' 
  | 'Meat & Seafood' 
  | 'Pantry & Grains' 
  | 'Spices & Condiments' 
  | 'Canned Goods' 
  | 'Snacks & Drinks' 
  | 'Frozen' 
  | 'Bakery';

export type EventCategory = 
  | 'school' 
  | 'work' 
  | 'sports' 
  | 'meals' 
  | 'health' 
  | 'chores' 
  | 'travel'
  | 'general';

export interface FamilyMember {
  id: string;
  name: string;
  role: 'Mom' | 'Dad' | 'Son' | 'Daughter' | 'Grandparent' | 'Pet' | 'Family Member' | 'Other';
  color: string; // Hex color code e.g. '#2563eb'
  bgClass: string; // e.g. 'bg-blue-100 text-blue-800 border-blue-300'
  badgeClass: string;
  avatarIcon?: string;
  dietaryNotes?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  memberIds: string[]; // Assigned family members
  date: string; // YYYY-MM-DD (start date)
  endDate?: string; // YYYY-MM-DD — for multi-day events like vacations/trips; omit for single-day events
  isAway?: boolean; // true = the assigned members are unavailable (traveling, etc) — randomizer skips them for chores during this range
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: EventCategory;
  location?: string;
  notes?: string;
  isMealPlan?: boolean;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  recipeId?: string;
  recipeTitle?: string;
}

export interface PantryItem {
  id: string;
  name: string;
  category: CategoryType;
  quantity: number;
  unit: string; // e.g. 'pcs', 'lbs', 'cups', 'box', 'cans', 'tbsp', 'bottle', 'oz'
  status: 'in_stock' | 'running_low' | 'out_of_stock';
  expiryDate?: string;
  notes?: string;
  updatedAt: string;
}

export interface RecipeIngredient {
  name: string;
  amount: string;
  inPantry?: boolean;
  pantryItemId?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTime: number; // mins
  cookTime: number; // mins
  servings: number;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: RecipeIngredient[];
  instructions: string[];
  isFavorite?: boolean;
  tags: string[];
  calories?: number;
  source?: 'AI Generated' | 'Family Favorite' | 'Community';
  imageUrl?: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: CategoryType;
  quantity: string;
  addedByMemberId?: string;
  assignedToMemberId?: string;
  isCompleted: boolean;
  urgent: boolean;
  sourcePantryItemId?: string;
  sourceRecipeTitle?: string;
  createdAt: string;
}

export interface SyncCalendarConfig {
  isConnected: boolean;
  accountEmail?: string;
  lastSyncedAt?: string;
  autoSyncMeals: boolean;
  importedCount?: number;
}

export type ChoreFrequency = 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Seasonal';
export type ChoreArea = 'Kitchen' | 'Living Room' | 'Dining Room' | 'Half Bathroom & Foyer' | 'Laundry Room' | 'Staircase';

export interface ChoreItem {
  id: string;
  title: string;
  area: ChoreArea;
  assignedMemberId?: string;
  frequency: ChoreFrequency;
  dueDate: string; // YYYY-MM-DD
  isCompleted: boolean;
  completedAt?: string;
  priority: 'Low' | 'Medium' | 'High';
  points: number;
  notes?: string;
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  pointsCost: number;
  emoji?: string; // simple visual tag, e.g. '🍕' or '💵'
}

export interface RewardRedemption {
  id: string;
  memberId: string;
  rewardId: string;
  rewardTitle: string; // snapshot in case the reward is edited/deleted later
  pointsCost: number; // snapshot for the same reason
  redeemedAt: string; // ISO date
  status: 'pending' | 'fulfilled'; // 'pending' until the physical reward is actually handed over
  fulfilledAt?: string;
}

