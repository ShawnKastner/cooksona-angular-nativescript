import {
  Component,
  NO_ERRORS_SCHEMA,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  NativeScriptCommonModule,
  RouterExtensions,
} from '@nativescript/angular';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';
import { HealthStore } from '@cooksona/health';
import type { MealEntry } from '@cooksona/api';
import type { Recipe } from '@cooksona/models';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import {
  MEAL_TYPE_CONFIG,
  type MealTypeKey,
} from '../meal-section/meal-section.config';
import { action, alert } from '@nativescript/core/ui/dialogs';
import { showCustomConfirm } from '../../../utils/custom-confirm';

interface MealTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  itemCount: number;
}

@Component({
  selector: 'ns-meal-detail',
  templateUrl: './meal-detail.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class MealDetailComponent {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(HealthStore);

  protected readonly loading = this.store.loading;
  protected readonly meals = this.store.meals;
  protected readonly mealType = toSignal(
    this.route.paramMap.pipe(
      map((params) => this.normalizeMealType(params.get('mealType'))),
    ),
    {
      initialValue: this.normalizeMealType(
        this.route.snapshot.paramMap.get('mealType'),
      ),
    },
  );

  protected readonly mealConfig = computed(() => {
    const type = this.mealType();
    return MEAL_TYPE_CONFIG[type];
  });

  protected readonly mealEntries = computed<MealEntry[]>(() => {
    const type = this.mealType();
    const entries = this.meals().filter((meal) => meal.mealType === type);
    return [...entries].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  });

  protected readonly totals = computed<MealTotals>(() => {
    const entries = this.mealEntries();
    const aggregate = entries.reduce(
      (acc, meal) => {
        acc.calories += meal.calories;
        acc.protein += meal.protein;
        acc.carbs += meal.carbs;
        acc.fat += meal.fat;
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 },
    );

    return {
      calories: Math.max(0, Math.round(aggregate.calories)),
      protein: Math.max(0, Math.round(aggregate.protein)),
      carbs: Math.max(0, Math.round(aggregate.carbs)),
      fat: Math.max(0, Math.round(aggregate.fat)),
      itemCount: entries.length,
    };
  });

  protected readonly isActionSheetOpen = signal(false);

  protected goBack(): void {
    this.routerExtensions.back();
  }

  protected onAddMeal(): void {
    void this.routerExtensions.navigate(['/track-meal'], {
      queryParams: { mealType: this.mealType() },
      transition: { name: 'slideLeft' },
    });
  }

  protected formatMealMacros(meal: MealEntry): string {
    const protein = Math.max(0, Math.round(meal.protein));
    const carbs = Math.max(0, Math.round(meal.carbs));
    const fat = Math.max(0, Math.round(meal.fat));
    return `${protein} g Eiweiß · ${carbs} g Kohlenhydrate · ${fat} g Fett`;
  }

  protected formatMealCalories(meal: MealEntry): string {
    return `${Math.max(0, Math.round(meal.calories))} kcal`;
  }

  protected formatTotalsLabel(): string {
    const count = this.totals().itemCount;
    if (count === 0) {
      return 'Noch keine Einträge';
    }
    if (count === 1) {
      return '1 Eintrag gespeichert';
    }
    return `${count} Einträge gespeichert`;
  }

  protected async onMealLongPress(meal: MealEntry): Promise<void> {
    try {
      if (this.isActionSheetOpen()) return;
      this.isActionSheetOpen.set(true);

      const result = await action({
        title: meal.name,
        cancelButtonText: 'Abbrechen',
        actions: ['Bearbeiten', 'Löschen'],
      });

      if (result === 'Bearbeiten') {
        setTimeout(() => {
          this.openEditMeal(meal)
            .catch((err: unknown) => {
              console.error('[MealDetail] open edit meal failed', err);
              alert({
                title: 'Fehler',
                message: 'Navigation fehlgeschlagen.',
                okButtonText: 'OK',
              }).catch((alertErr) =>
                console.error('[MealDetail] alert failed', alertErr),
              );
            })
            .finally(() => {
              setTimeout(() => {
                this.isActionSheetOpen.set(false);
              }, 50);
            });
        }, 100);
      } else if (result === 'Löschen') {
        setTimeout(async () => {
          await this.deleteMealWithConfirm(meal);
          setTimeout(() => {
            this.isActionSheetOpen.set(false);
          }, 50);
        }, 100);
      } else {
        setTimeout(() => {
          this.isActionSheetOpen.set(false);
        }, 300);
      }
    } catch (error) {
      console.error('[MealDetail] long press action failed', error);
      setTimeout(() => {
        this.isActionSheetOpen.set(false);
      }, 300);
    }
  }

  private normalizeMealType(mealType: string | null): MealTypeKey {
    if (mealType && mealType in MEAL_TYPE_CONFIG) {
      return mealType as MealTypeKey;
    }
    return 'breakfast';
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
      console.error('[MealDetail] open edit meal failed', error);
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
      console.error('[MealDetail] delete meal failed', error);
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
