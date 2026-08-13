import { FamilyMember, CalendarEvent, PantryItem, Recipe, ShoppingItem, SyncCalendarConfig, ChoreItem } from '../types';

// Helper for relative date strings YYYY-MM-DD
export function getRelativeDateString(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export const INITIAL_FAMILY_MEMBERS: FamilyMember[] = [
  {
    id: 'mem-1',
    name: 'Jellice',
    role: 'Family Member',
    color: '#9333ea', // Purple
    bgClass: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700',
    badgeClass: 'bg-purple-600 text-white',
    dietaryNotes: 'Low Sodium'
  },
  {
    id: 'mem-2',
    name: 'Briyanna',
    role: 'Family Member',
    color: '#ea580c', // Orange
    bgClass: 'bg-orange-100 text-orange-900 border-orange-300 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-700',
    badgeClass: 'bg-orange-600 text-white',
    dietaryNotes: 'High Protein, Low Carb'
  },
  {
    id: 'mem-3',
    name: 'Elisha',
    role: 'Family Member',
    color: '#16a34a', // Green
    bgClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-700',
    badgeClass: 'bg-emerald-600 text-white',
    dietaryNotes: undefined
  },
  {
    id: 'mem-4',
    name: 'Mikaela',
    role: 'Family Member',
    color: '#2563eb', // Blue
    bgClass: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700',
    badgeClass: 'bg-blue-600 text-white',
    dietaryNotes: 'No Seafood or Pork'
  }
];

export const INITIAL_EVENTS: CalendarEvent[] = [];

export const INITIAL_PANTRY: PantryItem[] = [];

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    title: 'Loaded Fresh Beef & Guacamole Tacos',
    description: 'Quick and vibrant family-style tacos made with seasoned ground beef, fresh mashed avocado guacamole, and warm tortillas.',
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    category: 'Mexican',
    difficulty: 'Easy',
    tags: ['Quick <30m', 'Kid Friendly', 'Family Favorite', 'High Protein'],
    calories: 520,
    source: 'Family Favorite',
    ingredients: [
      { name: 'Lean Ground Beef', amount: '1.5 lbs', inPantry: true },
      { name: 'Taco Seasoning', amount: '1 packet', inPantry: true },
      { name: 'Avocados', amount: '3 pcs', inPantry: true },
      { name: 'Roma Tomatoes', amount: '2 pcs (diced)', inPantry: true },
      { name: 'Yellow Onion', amount: '1/2 diced', inPantry: true },
      { name: 'Shredded Mozzarella Cheese', amount: '1 cup', inPantry: true },
      { name: 'Taco Tortilla Shells', amount: '8 shells', inPantry: false }
    ],
    instructions: [
      'Brown ground beef in a skillet over medium heat until fully cooked. Drain excess fat.',
      'Add taco seasoning and 1/4 cup water, simmer for 5 minutes until sauce thickens.',
      'In a bowl, mash avocados with diced tomatoes, chopped onion, salt, and lime juice for quick guacamole.',
      'Warm tortilla shells in oven or dry pan for 2 minutes.',
      'Assemble tacos with seasoned beef, shredded cheese, fresh guacamole, and enjoy!'
    ]
  },
  {
    id: 'rec-2',
    title: 'Garlic Butter Salmon & Sheet Pan Asparagus',
    description: 'Tender flaky salmon baked alongside roasted fresh asparagus tossed in lemon, garlic, and melted butter.',
    prepTime: 10,
    cookTime: 18,
    servings: 4,
    category: 'Seafood',
    difficulty: 'Easy',
    tags: ['Low Carb', 'Healthy', 'Sheet Pan'],
    calories: 440,
    source: 'AI Generated',
    ingredients: [
      { name: 'Atlantic Salmon Fillets', amount: '4 fillets (approx 1.5 lbs)', inPantry: false },
      { name: 'Fresh Asparagus', amount: '1 bunch', inPantry: true },
      { name: 'Garlic Cloves', amount: '4 minced', inPantry: true },
      { name: 'Unsalted Butter', amount: '3 tbsp melted', inPantry: true },
      { name: 'Extra Virgin Olive Oil', amount: '1 tbsp', inPantry: true },
      { name: 'Lemon', amount: '1 whole', inPantry: false }
    ],
    instructions: [
      'Preheat oven to 400°F (200°C) and line a large baking sheet with parchment paper.',
      'Arrange salmon fillets and trimmed asparagus side-by-side on sheet pan.',
      'Whisk melted butter, minced garlic, olive oil, salt, and pepper; drizzle evenly over salmon and asparagus.',
      'Bake for 15-18 minutes until salmon flakes easily with a fork and asparagus is tender-crisp.',
      'Squeeze fresh lemon juice over top before serving.'
    ]
  },
  {
    id: 'rec-3',
    title: 'Creamy Garlic Parmesan Chicken Pasta',
    description: 'Comforting penne pasta tossed with seared juicy chicken breast in a rich garlic parmesan cream sauce.',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    category: 'Italian',
    difficulty: 'Medium',
    tags: ['Comfort Food', 'High Protein', 'Kid Friendly'],
    calories: 680,
    source: 'Family Favorite',
    ingredients: [
      { name: 'Chicken Breast', amount: '1.5 lbs (cubed)', inPantry: true },
      { name: 'Penne Pasta', amount: '1 box (16 oz)', inPantry: true },
      { name: 'Garlic Cloves', amount: '5 minced', inPantry: true },
      { name: 'Heavy Whipping Cream', amount: '1 cup', inPantry: false },
      { name: 'Grated Parmesan Cheese', amount: '1/2 cup', inPantry: true },
      { name: 'Unsalted Butter', amount: '2 tbsp', inPantry: true },
      { name: 'Extra Virgin Olive Oil', amount: '1 tbsp', inPantry: true }
    ],
    instructions: [
      'Boil penne pasta in salted water according to package instructions; drain and set aside 1/2 cup pasta water.',
      'In a skillet, heat olive oil and cook cubed chicken breast seasoned with salt and pepper until golden and cooked through (6-8 mins). Remove chicken.',
      'Melt butter in the same pan, add minced garlic and sauté 1 minute until fragrant.',
      'Pour in heavy cream and Parmesan cheese; simmer until sauce thickens slightly.',
      'Toss in cooked penne, seared chicken, and reserved pasta water. Stir well to coat and serve hot.'
    ]
  },
  {
    id: 'rec-4',
    title: 'Homemade Artisan Margherita Pizza',
    description: 'Crispy homemade pizza crust topped with rich San Marzano tomato sauce, bubbly mozzarella cheese, and fresh basil.',
    prepTime: 20,
    cookTime: 12,
    servings: 4,
    category: 'Pizza',
    difficulty: 'Medium',
    tags: ['Vegetarian', 'Weekend Dinner', 'Fun with Kids'],
    calories: 490,
    source: 'Family Favorite',
    ingredients: [
      { name: 'Pizza Flour (00)', amount: '2 cups', inPantry: true },
      { name: 'San Marzano Canned Tomatoes', amount: '1 can (blend with garlic & salt)', inPantry: true },
      { name: 'Shredded Mozzarella Cheese', amount: '1.5 cups', inPantry: true },
      { name: 'Fresh Basil', amount: '1 handful', inPantry: false },
      { name: 'Extra Virgin Olive Oil', amount: '2 tbsp', inPantry: true }
    ],
    instructions: [
      'Mix pizza flour with yeast, warm water, and olive oil. Knead into smooth dough ball and let rise 45 mins.',
      'Preheat oven to 475°F (245°C) with a baking sheet or pizza stone inside.',
      'Stretch dough into 12-inch circle on parchment paper.',
      'Spread tomato sauce evenly, top with mozzarella cheese.',
      'Bake for 10-12 minutes until crust is golden brown and cheese is bubbling.',
      'Top with fresh basil leaves and drizzle olive oil before slicing.'
    ]
  }
];

export const INITIAL_SHOPPING_LIST: ShoppingItem[] = [];

export const INITIAL_SYNC_CONFIG: SyncCalendarConfig = {
  isConnected: true,
  accountEmail: 'family.clvrbrk@gmail.com',
  lastSyncedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  autoSyncMeals: true,
  importedCount: 14
};

export const INITIAL_CHORES: ChoreItem[] = [];

