import { Ingredient } from './plan.models';

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Recipe {
  id: string;
  name?: string; // display name used in UI
  title?: string; // optional alias
  description?: string;
  servings?: number;
  ingredients: Ingredient[];
  instructions?: string[];
  nutrition?: NutritionInfo;
}
