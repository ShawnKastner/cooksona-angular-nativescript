import {
  parseNutritionValue,
  getNutritionTotals,
  multiplyNutrition,
  roundCalories,
  roundMacro,
  clampPortion,
} from './nutrition.utils';

describe('nutrition.utils', () => {
  describe('parseNutritionValue', () => {
    it('parses numeric values directly', () => {
      expect(parseNutritionValue(12.5)).toBe(12.5);
    });

    it('extracts numbers from strings with units', () => {
      expect(parseNutritionValue('12,4 g')).toBeCloseTo(12.4, 5);
      expect(parseNutritionValue('250 kcal')).toBe(250);
    });

    it('returns null for non-numeric input', () => {
      expect(parseNutritionValue(null)).toBeNull();
      expect(parseNutritionValue(undefined)).toBeNull();
      expect(parseNutritionValue('abc')).toBeNull();
    });
  });

  describe('getNutritionTotals', () => {
    it('returns totals when all fields are numeric', () => {
      expect(
        getNutritionTotals({
          calories: '200 kcal',
          protein: '10 g',
          carbs: '20 g',
          fat: '5 g',
        })!,
      ).toMatchObject({
        calories: 200,
        protein: 10,
        carbs: 20,
        fat: 5,
      });
    });

    it('returns null when any field is missing', () => {
      expect(
        getNutritionTotals({
          calories: '200 kcal',
          protein: '10 g',
          carbs: '–',
          fat: '5 g',
        } as any),
      ).toBeNull();
    });
  });

  describe('multiplyNutrition', () => {
    it('scales nutrition by multiplier', () => {
      const result = multiplyNutrition(
        { calories: 100, protein: 10, carbs: 20, fat: 5 },
        2.5,
      );
      expect(result).toMatchObject({
        calories: 250,
        protein: 25,
        carbs: 50,
        fat: 12.5,
      });
    });
  });

  it('roundCalories rounds to whole numbers', () => {
    expect(roundCalories(123.4)).toBe(123);
    expect(roundCalories(123.5)).toBe(124);
  });

  it('roundMacro rounds to one decimal', () => {
    expect(roundMacro(12.34)).toBeCloseTo(12.3, 5);
    expect(roundMacro(12.36)).toBeCloseTo(12.4, 5);
  });

  describe('clampPortion', () => {
    it('limits values to range 0.25 - 10 in 0.25 steps', () => {
      expect(clampPortion(0)).toBe(0.25);
      expect(clampPortion(0.26)).toBe(0.25);
      expect(clampPortion(1.13)).toBe(1.25);
      expect(clampPortion(10.4)).toBe(10);
    });

    it('returns default when value invalid', () => {
      expect(clampPortion(Number.NaN)).toBe(1);
    });
  });
});
