import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import {
  MealPlan,
  DailyPlan,
  Ingredient,
  CategorizedShoppingList,
  ShoppingListItem,
} from '@cooksona/models/plan.models';
import { Recipe } from '@cooksona/models/recipe.models';

@Injectable({ providedIn: 'root' })
export class PlanApiService {
  constructor(private readonly api: ApiService) {}

  // Get all plans for a specific user
  async getPlansForUser(): Promise<MealPlan[]> {
    const plans = await this.api.get<MealPlan[]>('/plans');
    return plans ?? [];
  }

  // Create a new plan for a user
  createPlanForUser(
    planData: Omit<MealPlan, 'id' | 'createdAt' | 'userId' | 'shoppingList'> & {
      shoppingList: Ingredient[];
    }
  ): Promise<MealPlan | undefined> {
    return this.api.post<MealPlan>('/plans', planData);
  }

  // Delete a plan for a user
  deletePlanForUser(planIdToDelete: string): Promise<void | undefined> {
    return this.api.delete<void>(
      `/plans/${encodeURIComponent(planIdToDelete)}`
    );
  }

  saveCategorizedShoppingList(
    planId: string,
    categorizedList: CategorizedShoppingList
  ): Promise<MealPlan | undefined> {
    return this.api.post<MealPlan>(
      `/plans/${encodeURIComponent(planId)}/categorized-shopping-list`,
      {
        categorizedList,
      }
    );
  }

  updateShoppingList(
    planId: string,
    shoppingList: ShoppingListItem[]
  ): Promise<MealPlan | undefined> {
    return this.api.put<MealPlan>(`/plans/${encodeURIComponent(planId)}`, {
      shoppingList,
    });
  }

  // Client-side consolidation of shopping list
  private recalculateShoppingList(days: DailyPlan[]): ShoppingListItem[] {
    const allIngredients: Ingredient[] = [];
    for (const day of days) {
      for (const key of Object.keys(day)) {
        if (key !== 'day') {
          const meal = (day as Record<string, unknown>)[key] as
            | Recipe
            | undefined;
          const mealIngredients = (
            meal as unknown as { ingredients?: Ingredient[] } | undefined
          )?.ingredients;
          if (mealIngredients && Array.isArray(mealIngredients)) {
            allIngredients.push(...mealIngredients);
          }
        }
      }
    }

    const consolidated: Record<string, ShoppingListItem> = {};
    for (const ing of allIngredients) {
      const key = `${ing.name.trim().toLowerCase()}_${ing.unit
        .trim()
        .toLowerCase()}`;
      if (consolidated[key]) {
        const currentAmount = parseFloat(consolidated[key].amount);
        const newAmount = parseFloat(ing.amount);
        if (!Number.isNaN(currentAmount) && !Number.isNaN(newAmount)) {
          consolidated[key].amount = String(currentAmount + newAmount);
        } else {
          consolidated[
            key
          ].amount = `${consolidated[key].amount} + ${ing.amount}`;
        }
      } else {
        consolidated[key] = {
          ...ing,
          id: this.generateId(),
          checked: false,
        };
      }
    }

    return Object.values(consolidated);
  }

  private generateId(): string {
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
    } catch {}
    // Fallback
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  // Update functions perform client-side logic before PUT to backend
  async updateRecipeInPlan(
    planId: string,
    originalRecipeId: string,
    newRecipe: Recipe
  ): Promise<MealPlan | undefined> {
    const allPlans = await this.getPlansForUser();
    const planToUpdate = allPlans.find((p) => p.id === planId);
    if (!planToUpdate) throw new Error('Plan not found');

    let recipeUpdated = false;
    const updatedDays: DailyPlan[] = planToUpdate.days.map((day) => {
      const newDay: DailyPlan = { ...day };
      for (const key of Object.keys(newDay)) {
        if (key !== 'day') {
          const meal = (newDay as Record<string, unknown>)[key] as
            | Recipe
            | undefined;
          if (meal && meal.id === originalRecipeId) {
            (newDay as Record<string, unknown>)[key] = newRecipe as unknown as
              | Recipe
              | undefined;
            recipeUpdated = true;
          }
        }
      }
      return newDay;
    });

    if (recipeUpdated) {
      const nextPlan: MealPlan = { ...planToUpdate, days: updatedDays };
      nextPlan.shoppingList = this.recalculateShoppingList(nextPlan.days);
      return this.api.put<MealPlan>(
        `/plans/${encodeURIComponent(planId)}`,
        nextPlan
      );
    }

    return planToUpdate; // original if not updated
  }

  async swapMealInPlan(
    planId: string,
    dayName: string,
    mealKey: string,
    newRecipe: Recipe
  ): Promise<MealPlan | undefined> {
    const allPlans = await this.getPlansForUser();
    const planToUpdate = allPlans.find((p) => p.id === planId);
    if (!planToUpdate) throw new Error('Plan not found');

    let mealSwapped = false;
    const updatedDays: DailyPlan[] = planToUpdate.days.map((day) => {
      if (day.day === dayName) {
        const newDay: DailyPlan = { ...day };
        if (Object.prototype.hasOwnProperty.call(newDay, mealKey)) {
          (newDay as Record<string, unknown>)[mealKey] =
            newRecipe as unknown as Recipe | undefined;
          mealSwapped = true;
        }
        return newDay;
      }
      return day;
    });

    if (mealSwapped) {
      const nextPlan: MealPlan = { ...planToUpdate, days: updatedDays };
      nextPlan.shoppingList = this.recalculateShoppingList(nextPlan.days);
      return this.api.put<MealPlan>(
        `/plans/${encodeURIComponent(planId)}`,
        nextPlan
      );
    }

    return planToUpdate;
  }
}
