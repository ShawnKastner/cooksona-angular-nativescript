import { Ingredient } from './plan.models';

export interface NutritionInfo {
  calories: number;
  protein: string;
  carbs: string;
  fat: string;
}

export interface Recipe {
  id: string;
  name: string;
  servings?: number;
  ingredients: Ingredient[];
  nutrition?: NutritionInfo;
  instructions?: string[];
}
