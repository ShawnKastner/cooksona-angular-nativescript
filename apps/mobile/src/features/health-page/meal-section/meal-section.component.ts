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
import { showCustomConfirm } from '../../../utils/custom-confirm';
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
  protected isActionSheetOpen = signal(false);
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
      // Prevent multiple action sheets
      if (this.isActionSheetOpen()) return;

      this.isActionSheetOpen.set(true);

      const result = await action({
        title: meal.name,
        cancelButtonText: 'Abbrechen',
        actions: ['Bearbeiten', 'Löschen'],
      });

      if (result === 'Bearbeiten') {
        // Ensure the native action sheet is fully closed before navigating
        setTimeout(() => {
          this.openEditMeal(meal)
            .catch((err: any) => {
              console.error('[MealSection] open edit meal failed', err);
              alert({
                title: 'Fehler',
                message: 'Navigation fehlgeschlagen.',
                okButtonText: 'OK',
              });
            })
            .finally(() => {
              setTimeout(() => {
                this.isActionSheetOpen.set(false);
              }, 50);
            });
        }, 100);
      } else if (result === 'Löschen') {
        // Ensure the native action sheet is fully closed before showing confirm
        setTimeout(async () => {
          await this.deleteMealWithConfirm(meal);
          setTimeout(() => {
            this.isActionSheetOpen.set(false);
          }, 50);
        }, 100);
      } else {
        // Cancelled
        setTimeout(() => {
          this.isActionSheetOpen.set(false);
        }, 300);
      }
    } catch (error) {
      console.error('[MealSection] long press action failed', error);
      setTimeout(() => {
        this.isActionSheetOpen.set(false);
      }, 300);
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

  private async deleteMealWithConfirm(meal: MealEntry): Promise<void> {
    try {
      const confirmed = await showCustomConfirm({
        title: 'Mahlzeit löschen',
        message: `Möchtest du "${meal.name}" wirklich löschen?`,
        okButtonText: 'Löschen',
        cancelButtonText: 'Abbrechen',
        okButtonColor: '#EF4444',
      });

      if (!confirmed) return;

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
