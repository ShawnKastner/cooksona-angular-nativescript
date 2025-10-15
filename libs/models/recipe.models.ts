import { Ingredient } from './plan.models';

export interface NutritionInfo {
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
}

export interface Recipe {
  id: string;
  name: string;
  servings?: number;
  ingredients: Ingredient[];
  nutrition?: NutritionInfo;
  instructions?: string[];
}

export interface CookbookCollection {
  id: string;
  name: string;
}
