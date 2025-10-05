import {
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  signal,
  computed,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { HealthStore } from '../health.store';
import type { MealEntry } from '@cooksona/api';
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Apple,
  Droplet,
  Flame,
  Soup,
  Sandwich,
  Utensils,
  Cookie,
  ChevronDown,
} from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

type MealTypeKey = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

interface MealSection {
  key: MealTypeKey;
  label: string;
  icon: string;
  calories: number;
  items: MealEntry[];
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

  protected expandedMeal = signal<string | null>(null);
  protected readonly loading = this.store.loading;
  protected readonly meals = this.store.meals;

  protected readonly icons = {
    Soup,
    Sandwich,
    Cookie,
    Utensils,
    ChevronDown,
  } as const;

  // Computed meal sections based on fetched meals
  protected readonly mealSections = computed<MealSection[]>(() => {
    const allMeals = this.meals();

    const sections: MealSection[] = [
      {
        key: 'breakfast',
        label: 'Frühstück',
        icon: this.icons.Soup,
        calories: 0,
        items: [],
      },
      {
        key: 'lunch',
        label: 'Mittagessen',
        icon: this.icons.Sandwich,
        calories: 0,
        items: [],
      },
      {
        key: 'dinner',
        label: 'Abendessen',
        icon: this.icons.Utensils,
        calories: 0,
        items: [],
      },
      {
        key: 'snacks',
        label: 'Snacks',
        icon: this.icons.Cookie,
        calories: 0,
        items: [],
      },
    ];

    // Group meals by type and calculate calories
    allMeals.forEach((meal) => {
      const section = sections.find((s) => s.key === meal.mealType);
      if (section) {
        section.items.push(meal);
        section.calories += meal.calories;
      }
    });

    return sections;
  });

  protected toggleMeal(key: string): void {
    const current = this.expandedMeal();
    this.expandedMeal.set(current === key ? null : key);
  }
}
