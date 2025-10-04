import { Injectable } from '@angular/core';
import { Food, TrackedMeal, NutritionalValues } from '@cooksona/models';
import { getString, setString } from '@nativescript/core/application-settings';
import { MOCK_FOODS } from '../../../../../libs/constants/foods';

const TRACKED_MEALS_KEY = 'user_tracked_meals';
// can be removed later
@Injectable({
  providedIn: 'root',
})
export class MealTrackingService {
  private trackedMeals: TrackedMeal[] = [];
  private foods: Food[] = MOCK_FOODS;

  constructor() {
    this.loadTrackedMeals();
  }

  private loadTrackedMeals(): void {
    const stored = getString(TRACKED_MEALS_KEY);
    if (stored) {
      try {
        this.trackedMeals = JSON.parse(stored);
      } catch (error) {
        console.error('Error loading tracked meals:', error);
        this.trackedMeals = [];
      }
    }
  }

  private saveTrackedMeals(): void {
    try {
      setString(TRACKED_MEALS_KEY, JSON.stringify(this.trackedMeals));
    } catch (error) {
      console.error('Error saving tracked meals:', error);
    }
  }

  searchFoods(query: string): Food[] {
    if (!query || query.trim().length === 0) {
      return this.foods;
    }
    const searchTerm = query.toLowerCase().trim();
    return this.foods.filter((food) =>
      food.name.toLowerCase().includes(searchTerm),
    );
  }

  getFoodById(id: string): Food | undefined {
    return this.foods.find((food) => food.id === id);
  }

  calculateNutrition(
    nutritionalValues: NutritionalValues,
    portionGrams: number,
  ): NutritionalValues {
    const factor = portionGrams / 100;
    return {
      calories: Math.round(nutritionalValues.calories * factor),
      protein: Math.round(nutritionalValues.protein * factor * 10) / 10,
      carbs: Math.round(nutritionalValues.carbs * factor * 10) / 10,
      fat: Math.round(nutritionalValues.fat * factor * 10) / 10,
    };
  }

  trackMeal(userId: string, food: Food, portionGrams: number): TrackedMeal {
    const now = new Date();
    const calculatedNutrition = this.calculateNutrition(
      food.nutritionalValues,
      portionGrams,
    );

    const trackedMeal: TrackedMeal = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      date: now.toISOString().split('T')[0],
      timestamp: now.getTime(),
      food,
      portionGrams,
      calculatedNutrition,
    };

    this.trackedMeals.unshift(trackedMeal);
    this.saveTrackedMeals();
    return trackedMeal;
  }

  trackManualFood(
    userId: string,
    name: string,
    nutritionalValues: NutritionalValues,
    portionGrams: number,
  ): TrackedMeal {
    const manualFood: Food = {
      id: `manual_${Date.now()}`,
      name,
      category: 'other',
      nutritionalValues,
      servingSize: portionGrams,
    };

    return this.trackMeal(userId, manualFood, portionGrams);
  }

  getMealsByDate(date: string): TrackedMeal[] {
    return this.trackedMeals.filter((meal) => meal.date === date);
  }

  getMealsByUserId(userId: string): TrackedMeal[] {
    return this.trackedMeals.filter((meal) => meal.userId === userId);
  }

  getAllMeals(): TrackedMeal[] {
    return [...this.trackedMeals];
  }

  deleteMeal(mealId: string): boolean {
    const index = this.trackedMeals.findIndex((m) => m.id === mealId);
    if (index > -1) {
      this.trackedMeals.splice(index, 1);
      this.saveTrackedMeals();
      return true;
    }
    return false;
  }

  getTodayTotalNutrition(userId: string): NutritionalValues {
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = this.trackedMeals.filter(
      (m) => m.userId === userId && m.date === today,
    );

    return todayMeals.reduce(
      (total, meal) => ({
        calories: total.calories + meal.calculatedNutrition.calories,
        protein: total.protein + meal.calculatedNutrition.protein,
        carbs: total.carbs + meal.calculatedNutrition.carbs,
        fat: total.fat + meal.calculatedNutrition.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );
  }
}
