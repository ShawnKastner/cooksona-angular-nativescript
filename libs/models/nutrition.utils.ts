import type { NutritionInfo } from './recipe.models';

export type NutritionTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

const DECIMAL_REGEX = /-?\d+(?:[.,]\d+)?/;

/**
 * Attempts to parse a numeric value from a nutrition field that might contain
 * units (e.g. "12,5 g" or "250 kcal"). Returns null when no numeric portion
 * can be extracted.
 */
export function parseNutritionValue(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value !== 'string') return null;

  const match = value.match(DECIMAL_REGEX);
  if (!match) return null;

  const normalized = match[0].replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getNutritionTotals(
  nutrition: NutritionInfo | null | undefined,
): NutritionTotals | null {
  if (!nutrition) return null;

  const calories = parseNutritionValue(nutrition.calories);
  const protein = parseNutritionValue(nutrition.protein);
  const carbs = parseNutritionValue(nutrition.carbs);
  const fat = parseNutritionValue(nutrition.fat);

  if (calories === null || protein === null || carbs === null || fat === null) {
    return null;
  }

  return { calories, protein, carbs, fat };
}

export function multiplyNutrition(
  base: NutritionTotals,
  multiplier: number,
): NutritionTotals {
  return {
    calories: Math.round(base.calories * multiplier),
    protein: Math.round(base.protein * multiplier),
    carbs: Math.round(base.carbs * multiplier),
    fat: Math.round(base.fat * multiplier),
  };
}

export function roundCalories(value: number): number {
  return Math.round(value);
}

export function roundMacro(value: number): number {
  return Math.round(value * 10) / 10;
}

export function clampPortion(value: number): number {
  if (!Number.isFinite(value) || Number.isNaN(value)) return 1;
  if (value < 0.25) return 0.25;
  if (value > 10) return 10;
  return Math.round(value * 4) / 4;
}
