import { Recipe } from './recipe.models';

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface ShoppingListItem extends Ingredient {
  id: string;
  checked: boolean;
}

export interface PlannerOptions {
  diet: string;
  allergies: string;
  people: number;
  planDays: number;
  cookTime: string;
  calories?: number;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
    dessert: boolean;
  };
  enableNutritionAnalysis?: boolean;
  planFocus?: 'ausgewogen' | 'proteinreich' | 'kohlenhydratarm' | 'fettarm';
  gourmetMode?: boolean;
}

export interface DailyPlan {
  day: string;
  breakfast?: Recipe;
  lunch?: Recipe;
  dinner?: Recipe;
  snack?: Recipe;
  dessert?: Recipe;
}

export interface CategorizedShoppingListItem {
  category: string;
  items: ShoppingListItem[];
}

export type CategorizedShoppingList = CategorizedShoppingListItem[];

export interface MealPlan {
  id: string;
  createdAt: string;
  userId: string;
  options: PlannerOptions;
  days: DailyPlan[];
  shoppingList: ShoppingListItem[];
  categorizedShoppingList?: CategorizedShoppingList | null;
}
