import {
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  signal,
  computed,
} from '@angular/core';
import {
  NativeScriptCommonModule,
  RouterExtensions,
} from '@nativescript/angular';
import { HealthStore } from '@cooksona/health';
import type { MealEntry } from '@cooksona/api';
import {
  Soup,
  Sandwich,
  Utensils,
  Cookie,
  ChevronDown,
} from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import type { Recipe } from '@cooksona/models';
import { action, alert } from '@nativescript/core/ui/dialogs';
import { Router } from '@angular/router';

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
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly router = inject(Router);

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

  protected async onMealLongPress(meal: MealEntry): Promise<void> {
    try {
      const result = await action({
        title: meal.name,
        cancelButtonText: 'Abbrechen',
        actions: ['Bearbeiten', 'Löschen'],
      });

      if (result === 'Bearbeiten') {
        await this.openEditMeal(meal);
      } else if (result === 'Löschen') {
        await this.deleteMeal(meal);
      }
    } catch (error) {
      console.error('[MealSection] long press action failed', error);
    }
  }

  private async openEditMeal(meal: MealEntry): Promise<void> {
    if (meal.sourceType !== 'recipe') {
      await alert({
        title: 'Bearbeiten nicht möglich',
        message: 'Nur Rezepte mit Nährwertangaben können bearbeitet werden.',
        okButtonText: 'OK',
      });
      return;
    }
    try {
      const recipe = this.buildRecipeFromMeal(meal);
      await this.routerExtensions.navigate(
        ['/tracking-recipe', recipe.id ?? meal.id],
        {
          state: {
            recipe,
            mealEntry: meal,
          },
          transition: { name: 'slideLeft' },
        },
      );
    } catch (error) {
      console.error('[MealSection] open edit meal failed', error);
    }
  }

  private async deleteMeal(meal: MealEntry): Promise<void> {
    try {
      await this.store.deleteMeal(meal.id);
    } catch (error) {
      console.error('[MealSection] delete meal failed', error);
      await alert({
        title: 'Fehler',
        message: 'Die Mahlzeit konnte nicht gelöscht werden.',
        okButtonText: 'OK',
      });
    }
  }

  private buildRecipeFromMeal(meal: MealEntry): Recipe {
    return {
      id: meal.recipeId ?? meal.id,
      name: meal.name,
      ingredients: [],
      nutrition: {
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
      },
    };
  }
}
