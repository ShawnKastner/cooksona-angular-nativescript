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
}

export type CategorizedShoppingList = Record<string, ShoppingListItem[]>;
