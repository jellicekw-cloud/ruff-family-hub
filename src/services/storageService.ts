import { FamilyMember, CalendarEvent, PantryItem, Recipe, ShoppingItem, SyncCalendarConfig, ChoreItem, ChoreArea } from '../types';
import { 
  INITIAL_FAMILY_MEMBERS, 
  INITIAL_EVENTS, 
  INITIAL_PANTRY, 
  INITIAL_RECIPES, 
  INITIAL_SHOPPING_LIST,
  INITIAL_SYNC_CONFIG,
  INITIAL_CHORES 
} from '../data/initialData';

const STORAGE_KEYS = {
  FAMILY_MEMBERS: 'family_hub_members_v2',
  EVENTS: 'family_hub_events_v3',
  PANTRY: 'family_hub_pantry_v2',
  RECIPES: 'family_hub_recipes_v1',
  SHOPPING: 'family_hub_shopping_v1',
  SYNC_CONFIG: 'family_hub_sync_config_v1',
  CHORES: 'family_hub_chores_v3'
};

export const storageService = {
  getMembers(): FamilyMember[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAMILY_MEMBERS);
      if (!data) {
        // Clear legacy v1 key if present
        localStorage.removeItem('family_hub_members_v1');
        return INITIAL_FAMILY_MEMBERS;
      }
      const parsed = JSON.parse(data);
      // If cached data has legacy names, override with INITIAL_FAMILY_MEMBERS
      if (Array.isArray(parsed) && parsed.some(m => ['Sarah', 'David', 'Leo', 'Maya'].includes(m.name))) {
        return INITIAL_FAMILY_MEMBERS;
      }
      return parsed;
    } catch {
      return INITIAL_FAMILY_MEMBERS;
    }
  },

  saveMembers(members: FamilyMember[]): void {
    localStorage.setItem(STORAGE_KEYS.FAMILY_MEMBERS, JSON.stringify(members));
  },

  getEvents(): CalendarEvent[] {
    try {
      localStorage.removeItem('family_hub_events_v1');
      localStorage.removeItem('family_hub_events_v2');
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      return data ? JSON.parse(data) : INITIAL_EVENTS;
    } catch {
      return INITIAL_EVENTS;
    }
  },

  saveEvents(events: CalendarEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
  },

  getPantry(): PantryItem[] {
    try {
      localStorage.removeItem('family_hub_pantry_v1');
      const data = localStorage.getItem(STORAGE_KEYS.PANTRY);
      return data ? JSON.parse(data) : INITIAL_PANTRY;
    } catch {
      return INITIAL_PANTRY;
    }
  },

  savePantry(pantry: PantryItem[]): void {
    localStorage.setItem(STORAGE_KEYS.PANTRY, JSON.stringify(pantry));
  },

  getRecipes(): Recipe[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.RECIPES);
      return data ? JSON.parse(data) : INITIAL_RECIPES;
    } catch {
      return INITIAL_RECIPES;
    }
  },

  saveRecipes(recipes: Recipe[]): void {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  },

  getShoppingList(): ShoppingItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SHOPPING);
      return data ? JSON.parse(data) : INITIAL_SHOPPING_LIST;
    } catch {
      return INITIAL_SHOPPING_LIST;
    }
  },

  saveShoppingList(list: ShoppingItem[]): void {
    localStorage.setItem(STORAGE_KEYS.SHOPPING, JSON.stringify(list));
  },

  getSyncConfig(): SyncCalendarConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_CONFIG);
      return data ? JSON.parse(data) : INITIAL_SYNC_CONFIG;
    } catch {
      return INITIAL_SYNC_CONFIG;
    }
  },

  saveSyncConfig(config: SyncCalendarConfig): void {
    localStorage.setItem(STORAGE_KEYS.SYNC_CONFIG, JSON.stringify(config));
  },

  getChores(): ChoreItem[] {
    try {
      localStorage.removeItem('family_hub_chores_v1');
      localStorage.removeItem('family_hub_chores_v2');
      const data = localStorage.getItem(STORAGE_KEYS.CHORES);
      if (!data) return INITIAL_CHORES;
      const parsed: ChoreItem[] = JSON.parse(data);
      const validAreas = ['Kitchen', 'Living Room', 'Dining Room', 'Half Bathroom & Foyer', 'Laundry Room'];
      const areaMap: Record<string, ChoreArea> = {
        'Bathrooms': 'Half Bathroom & Foyer',
        'Laundry & Closet': 'Laundry Room',
        'Bedrooms': 'Living Room',
        'Outdoor & Yard': 'Half Bathroom & Foyer',
        'General': 'Kitchen'
      };
      return parsed.map(c => ({
        ...c,
        area: validAreas.includes(c.area) ? c.area : (areaMap[c.area] || 'Kitchen')
      }));
    } catch {
      return INITIAL_CHORES;
    }
  },

  saveChores(chores: ChoreItem[]): void {
    localStorage.setItem(STORAGE_KEYS.CHORES, JSON.stringify(chores));
  },

  resetAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.FAMILY_MEMBERS);
    localStorage.removeItem(STORAGE_KEYS.EVENTS);
    localStorage.removeItem(STORAGE_KEYS.PANTRY);
    localStorage.removeItem(STORAGE_KEYS.RECIPES);
    localStorage.removeItem(STORAGE_KEYS.SHOPPING);
    localStorage.removeItem(STORAGE_KEYS.SYNC_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.CHORES);
  }
};
