import { Recipe } from './recipe.models';

export interface Ingredient {
  name: string;
  unit: string;
  amount: string; // keep as string to match free-form inputs
}

export interface ShoppingListItem extends Ingredient {
  id: string;
  checked: boolean;
  category?: string;
}

// Flexible daily plan: allows arbitrary meal keys except the required "day"
export type DailyPlan = { day: string } & Record<string, Recipe | undefined>;

export interface MealPlan {
  id: string;
  userId: string;
  createdAt: string;
  days: DailyPlan[];
  shoppingList: ShoppingListItem[];
  title?: string;
  notes?: string;
  options?: PlannerOptions;
}

export type CategorizedShoppingList = Record<string, ShoppingListItem[]>;

export interface PlannerOptions {
  diet?: string;
  allergies?: string;
  people: number; // 1..10
  planDays: number; // 1..14
  cookTime: string; // e.g., '30 Minuten'
  calories?: number; // optional
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
    dessert: boolean;
  };
  enableNutritionAnalysis: boolean;
  planFocus: string; // 'ausgewogen' | ...
  gourmetMode: boolean;
}
