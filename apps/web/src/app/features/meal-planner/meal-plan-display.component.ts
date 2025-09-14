import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealPlan, DailyPlan } from '@cooksona/models/plan.models';
import { Recipe } from '@cooksona/models/recipe.models';
import {
  ChevronDown,
  Sandwich,
  Soup,
  Utensils,
  Cookie,
  CakeSlice,
  BarChart2,
  BookText,
  Heart,
  Wand2,
  Users,
  Shuffle,
} from 'libs/constants/icons';

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

@Component({
  selector: 'app-meal-plan-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './meal-plan-display.component.html',
})
export class MealPlanDisplayComponent {
  @Input({ required: true }) mealPlan!: MealPlan;
  @Input({ required: true }) favoriteRecipeIds!: Set<string>;
  @Input() isProUser = false;
  @Input() swappingMealId: string | null = null;

  @Output() showRecipe = new EventEmitter<Recipe>();
  @Output() toggleFavorite = new EventEmitter<Recipe>();
  @Output() openTransformModal = new EventEmitter<Recipe>();
  @Output() swapMeal = new EventEmitter<{ dayName: string; mealKey: string; recipe: Recipe }>();

  openIndex = signal<number | null>(0);

  readonly tMeal: Record<MealKey, string> = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
    dessert: 'Dessert',
  } as const;

  readonly icons = { ChevronDown, Sandwich, Soup, Utensils, Cookie, CakeSlice, BarChart2, BookText, Heart, Wand2, Users, Shuffle } as const;

  mealIcon(key: MealKey): string | null {
    switch (key) {
      case 'breakfast':
        return Soup;
      case 'lunch':
        return Sandwich;
      case 'dinner':
        return Utensils;
      case 'snack':
        return Cookie;
      case 'dessert':
        return CakeSlice;
      default:
        return null;
    }
  }

  isOpen(index: number): boolean {
    return this.openIndex() === index;
  }

  handleToggle(index: number): void {
    this.openIndex.set(this.isOpen(index) ? null : index);
  }

  mealKeys: ReadonlyArray<MealKey> = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const;

  servingsFor(recipe: Recipe): number | undefined {
    return recipe.servings ?? this.mealPlan.options?.people;
  }

  isFav(id: string): boolean {
    return this.favoriteRecipeIds?.has(id) ?? false;
  }

  // Helpers for template logic
  getMeal(day: DailyPlan, key: MealKey): Recipe | undefined {
    return (day as any)[key] as Recipe | undefined;
  }
  fillerCount(recipe: Recipe): number {
    const len = (recipe?.ingredients ?? []).length;
    return Math.max(0, 5 - len);
  }

  range(n: number): number[] {
    return Array.from({ length: n }, (_, i) => i);
  }
}

