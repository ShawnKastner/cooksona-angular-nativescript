import { Component, inject, NO_ERRORS_SCHEMA, computed } from '@angular/core';
import {
  NativeScriptCommonModule,
  RouterExtensions,
} from '@nativescript/angular';
import { HealthStore } from '@cooksona/health';
import type { MealEntry } from '@cooksona/api';
import { ChevronRight, Plus } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import {
  MEAL_TYPE_CONFIG,
  MEAL_TYPE_ORDER,
  type MealTypeKey,
} from './meal-section.config';

interface MealSection {
  key: MealTypeKey;
  label: string;
  icon: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  items: MealEntry[];
  itemCount: number;
  macroSummary: string;
  previewText: string;
}

@Component({
  selector: 'ns-meal-section',
  templateUrl: './meal-section.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class MealSectionComponent {
  private readonly store = inject(HealthStore);
  private readonly routerExtensions = inject(RouterExtensions);

  protected readonly loading = this.store.loading;
  protected readonly meals = this.store.meals;

  protected readonly icons = {
    ChevronRight,
    Plus,
  } as const;

  // Computed meal sections based on fetched meals
  protected readonly mealSections = computed<MealSection[]>(() => {
    const allMeals = this.meals();

    const sections: MealSection[] = MEAL_TYPE_ORDER.map((key) => ({
      key,
      label: MEAL_TYPE_CONFIG[key].label,
      icon: MEAL_TYPE_CONFIG[key].icon,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      items: [],
      itemCount: 0,
      macroSummary: '',
      previewText: '',
    }));

    // Group meals by type and calculate calories
    allMeals.forEach((meal) => {
      const section = sections.find((s) => s.key === meal.mealType);
      if (section) {
        section.items.push(meal);
        section.calories += meal.calories;
        section.protein += meal.protein;
        section.carbs += meal.carbs;
        section.fat += meal.fat;
      }
    });

    return sections.map((section) => {
      const itemCount = section.items.length;
      const calories = Math.max(0, Math.round(section.calories));
      const protein = Math.max(0, Math.round(section.protein));
      const carbs = Math.max(0, Math.round(section.carbs));
      const fat = Math.max(0, Math.round(section.fat));

      return {
        ...section,
        calories,
        protein,
        carbs,
        fat,
        itemCount,
        macroSummary:
          itemCount === 0
            ? 'Noch keine Makros erfasst'
            : `${protein} g Eiweiß · ${carbs} g Kohlenhydrate · ${fat} g Fett`,
        previewText: this.buildPreviewText(section.items),
      };
    });
  });

  protected openMealDetail(mealType: MealTypeKey): void {
    void this.routerExtensions.navigate(['/meal-detail', mealType], {
      transition: { name: 'slideLeft' },
    });
  }

  protected onAddMeal(mealType: MealTypeKey): void {
    void this.routerExtensions.navigate(['/track-meal'], {
      queryParams: { mealType },
      transition: { name: 'slideLeft' },
    });
  }

  private buildPreviewText(items: MealEntry[]): string {
    if (!items.length) {
      return 'Noch nichts eingetragen';
    }

    const topItems = items.slice(0, 2).map((item) => item.name);
    const remaining = items.length - topItems.length;
    const base = topItems.join(', ');

    if (remaining <= 0) {
      return base;
    }

    return `${base} +${remaining} weitere`;
  }
}
