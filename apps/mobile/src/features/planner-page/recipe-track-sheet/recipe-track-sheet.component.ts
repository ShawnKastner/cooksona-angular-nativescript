import {
  ChangeDetectionStrategy,
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
import { ActivatedRoute, Router } from '@angular/router';
import type { Recipe } from '@cooksona/models';
import type { MealEntry } from '@cooksona/api';
import {
  clampPortion,
  getNutritionTotals,
  multiplyNutrition,
  roundCalories,
  roundMacro,
  type NutritionTotals,
} from '@cooksona/models';
import { icons } from '@cooksona/constants/icons';
import { HealthStore } from '@cooksona/health';
import { Dialogs, EventData, TextField } from '@nativescript/core';
import { AnalyticsService } from '@cooksona/analytics';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

const MEAL_TYPES: Array<{ key: MealType; label: string; description: string }> =
  [
    {
      key: 'breakfast',
      label: 'Frühstück',
      description: 'Ideal zwischen 5:00 und 10:30 Uhr',
    },
    {
      key: 'lunch',
      label: 'Mittagessen',
      description: 'Perfekt für 10:30 bis 15:00 Uhr',
    },
    {
      key: 'dinner',
      label: 'Abendessen',
      description: 'Für 15:00 bis 21:00 Uhr',
    },
    {
      key: 'snacks',
      label: 'Snacks',
      description: 'Für Zeiten außerhalb der Hauptmahlzeiten',
    },
  ];

@Component({
  selector: 'ns-recipe-track-sheet',
  standalone: true,
  imports: [NativeScriptCommonModule],
  templateUrl: './recipe-track-sheet.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [NO_ERRORS_SCHEMA],
  styles: [
    `
      .meal-option {
        transition:
          background-color 150ms,
          border-color 150ms;
      }
      .selected-meal-option {
        border-color: var(--color-primary, #4a6c6f);
        background-color: rgba(74, 108, 111, 0.1);
      }
      .macro-wrapper .macro-card {
        width: 48%;
        margin-bottom: 12px;
        border-width: 1px;
      }
      .macro-label {
        margin-bottom: 4px;
      }
    `,
  ],
})
export class RecipeTrackSheetComponent {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly healthStore = inject(HealthStore);
  private readonly analytics = inject(AnalyticsService);

  private readonly initialContext = this.resolveInitialContext();

  readonly icons = icons;
  readonly mealTypes = MEAL_TYPES;
  readonly recipe = signal<Recipe | null>(this.initialContext.recipe ?? null);
  private readonly mealEntry = this.initialContext.mealEntry ?? null;
  readonly baseNutrition = signal<NutritionTotals | null>(null);
  readonly portion = signal(1);
  readonly mealType = signal<MealType>(this.getDefaultMealType());
  readonly selectedDateTime = signal(new Date());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly totals = computed(() => {
    const base = this.baseNutrition();
    const portion = this.portion();
    if (!base || !Number.isFinite(portion)) return null;
    return multiplyNutrition(base, portion);
  });
  readonly canTrack = computed(() => this.baseNutrition() !== null);
  readonly isEditMode = this.mealEntry !== null;

  constructor() {
    this.initializeFromContext();
  }

  goBack(): void {
    this.routerExtensions.back();
  }

  increasePortion(): void {
    this.portion.set(clampPortion(this.portion() + 0.25));
  }

  decreasePortion(): void {
    this.portion.set(clampPortion(this.portion() - 0.25));
  }

  onPortionInput(event: EventData): void {
    const textField = event?.object as TextField | undefined;
    const text = textField?.text ?? '';
    const value = Number.parseFloat(text);
    const clamped = clampPortion(value);
    this.portion.set(clamped);
    if (!Number.isFinite(value) || value <= 0) {
      this.error.set(
        'Bitte gib eine gültige Portionsanzahl zwischen 0,25 und 10 ein.',
      );
    } else {
      this.error.set(null);
    }
  }

  selectMealType(type: MealType): void {
    this.mealType.set(type);
  }

  onDateChange(event: any): void {
    const value = event?.value instanceof Date ? event.value : null;
    if (!value) return;
    const current = this.selectedDateTime();
    const updated = new Date(
      value.getFullYear(),
      value.getMonth(),
      value.getDate(),
      current.getHours(),
      current.getMinutes(),
    );
    this.selectedDateTime.set(updated);
  }

  onTimeChange(event: any): void {
    let hours: number | null = null;
    let minutes: number | null = null;
    if (event?.value instanceof Date) {
      hours = event.value.getHours();
      minutes = event.value.getMinutes();
    } else if (
      typeof event?.hour === 'number' &&
      typeof event?.minute === 'number'
    ) {
      hours = event.hour;
      minutes = event.minute;
    }
    if (hours === null || minutes === null) return;
    const current = this.selectedDateTime();
    const updated = new Date(
      current.getFullYear(),
      current.getMonth(),
      current.getDate(),
      hours,
      minutes,
    );
    this.selectedDateTime.set(updated);
  }

  formatDateLabel(): string {
    const d = this.selectedDateTime();
    return d.toLocaleDateString('de-DE');
  }

  formatTimeLabel(): string {
    const d = this.selectedDateTime();
    return d.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  displayCalories(): string {
    const totals = this.totals();
    if (!totals) return '–';
    return `${roundCalories(totals.calories)} kcal`;
  }

  displayMacro(field: keyof NutritionTotals): string {
    const totals = this.totals();
    if (!totals) return '–';
    return `${roundMacro(totals[field])} g`;
  }

  async handleAddNutrition(): Promise<void> {
    const recipe = this.recipe();
    if (!recipe?.id) {
      await Dialogs.alert({
        title: 'Rezeptdaten fehlen',
        message:
          'Keine Rezeptdaten verfügbar. Kehre zurück und öffne das Tracking erneut aus der Rezeptansicht.',
        okButtonText: 'OK',
      });
      return;
    }
    await this.routerExtensions.navigate(['/transform-recipe', recipe.id], {
      state: { recipe, source: 'tracking' },
      transition: { name: 'slideLeft' },
    });
  }

  async save(): Promise<void> {
    if (this.loading()) return;
    const recipe = this.recipe();
    const totals = this.totals();
    const base = this.baseNutrition();
    if (!recipe || !totals || !base) {
      await Dialogs.alert({
        title: 'Nährwerte fehlen',
        message:
          'Bitte ergänze die Nährwerte pro Portion, bevor du das Rezept trackst.',
        okButtonText: 'OK',
      });
      return;
    }

    const portion = this.portion();
    if (!Number.isFinite(portion) || portion <= 0) {
      this.error.set(
        'Bitte gib eine gültige Portionsanzahl zwischen 0,25 und 10 ein.',
      );
      return;
    }

    const datetime = this.selectedDateTime();
    if (Number.isNaN(datetime.getTime())) {
      this.error.set('Bitte wähle ein gültiges Datum und eine Uhrzeit aus.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    const payload = {
      date: this.formatDateForApi(datetime),
      name: recipe.name,
      sourceType: 'recipe' as const,
      mealType: this.mealType(),
      recipeId: recipe.id,
      calories: totals.calories,
      protein: totals.protein,
      carbs: totals.carbs,
      fat: totals.fat,
    };

    try {
      if (this.mealEntry) {
        await this.healthStore.updateMeal(this.mealEntry.id, payload);
        await Dialogs.alert({
          title: 'Aktualisiert',
          message: 'Der Tracking-Eintrag wurde aktualisiert.',
          okButtonText: 'OK',
        });
        this.analytics.trackRecipeTracking({
          action: 'update',
          mealType: this.mealType(),
          portion,
          platform: 'mobile',
        });
      } else {
        await this.healthStore.createMeal(payload);
        await Dialogs.alert({
          title: 'Erfolgreich gespeichert',
          message: 'Das Rezept wurde deinem Ernährungstagebuch hinzugefügt.',
          okButtonText: 'OK',
        });
        this.analytics.trackRecipeTracking({
          action: 'create',
          mealType: this.mealType(),
          portion,
          platform: 'mobile',
        });
      }
      this.routerExtensions.back();
    } catch (e: any) {
      console.error('[RecipeTrackSheet] save failed', e);
      const message =
        e?.message ??
        'Das Rezept konnte nicht gespeichert werden. Bitte versuche es später erneut.';
      this.error.set(message);
      await Dialogs.alert({
        title: 'Fehler',
        message,
        okButtonText: 'OK',
      });
    } finally {
      this.loading.set(false);
    }
  }

  private resolveInitialContext(): {
    recipe: Recipe | null;
    mealEntry: MealEntry | null;
  } {
    const navState =
      (this.router.getCurrentNavigation()?.extras?.state as Record<
        string,
        unknown
      > | null) ?? null;
    const historyState =
      (typeof history !== 'undefined'
        ? (history.state as Record<string, unknown>)
        : null) ?? null;
    const state =
      navState && (navState['recipe'] || navState['mealEntry'])
        ? navState
        : historyState && (historyState['recipe'] || historyState['mealEntry'])
          ? historyState
          : {};

    const mealEntry =
      (state['mealEntry'] as MealEntry | null | undefined) ?? null;
    let recipe = (state['recipe'] as Recipe | null | undefined) ?? null;

    if (!recipe && mealEntry) {
      recipe = {
        id: mealEntry.recipeId ?? mealEntry.id,
        name: mealEntry.name,
        ingredients: [],
        nutrition: {
          calories: mealEntry.calories,
          protein: mealEntry.protein,
          carbs: mealEntry.carbs,
          fat: mealEntry.fat,
        },
      };
    }

    if (!recipe) {
      const paramId = this.route.snapshot.paramMap.get('id');
      if (paramId) {
        recipe = {
          id: paramId,
          name: state['recipeName']?.toString() ?? 'Rezept',
          ingredients: [],
          nutrition: mealEntry
            ? {
                calories: mealEntry.calories,
                protein: mealEntry.protein,
                carbs: mealEntry.carbs,
                fat: mealEntry.fat,
              }
            : undefined,
        };
      }
    }

    return { recipe, mealEntry };
  }

  private initializeFromContext(): void {
    const recipe = this.recipe();
    const base = this.computeBaseNutrition(recipe, this.mealEntry);
    this.baseNutrition.set(base);

    if (this.mealEntry) {
      if (this.mealEntry.mealType) {
        this.mealType.set(this.mealEntry.mealType);
      }
      if (base) {
        const portion = clampPortion(
          this.derivePortionFromTotals(this.mealEntry, base),
        );
        this.portion.set(portion);
      }
      this.selectedDateTime.set(this.parseDateFromMeal(this.mealEntry));
    } else {
      this.portion.set(1);
      this.mealType.set(this.getDefaultMealType());
      this.selectedDateTime.set(new Date());
    }
  }

  private derivePortionFromTotals(
    meal: MealEntry,
    base: NutritionTotals,
  ): number {
    if (base.calories > 0) {
      return meal.calories / base.calories;
    }
    if (base.protein > 0) {
      return meal.protein / base.protein;
    }
    if (base.carbs > 0) {
      return meal.carbs / base.carbs;
    }
    if (base.fat > 0) {
      return meal.fat / base.fat;
    }
    return 1;
  }

  private computeBaseNutrition(
    recipe: Recipe | null,
    meal: MealEntry | null,
  ): NutritionTotals | null {
    const fromRecipe = getNutritionTotals(recipe?.nutrition);
    if (fromRecipe) return fromRecipe;
    if (!meal) return null;
    return {
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fat: meal.fat,
    };
  }

  private parseDateFromMeal(meal: MealEntry): Date {
    if (meal.date) {
      const dt = new Date(`${meal.date}T00:00`);
      if (!Number.isNaN(dt.getTime())) {
        return dt;
      }
    }
    return new Date();
  }

  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getDefaultMealType(): MealType {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    if (minutes >= 5 * 60 && minutes <= 10 * 60 + 30) {
      return 'breakfast';
    }
    if (minutes > 10 * 60 + 30 && minutes <= 15 * 60) {
      return 'lunch';
    }
    if (minutes > 15 * 60 && minutes <= 21 * 60) {
      return 'dinner';
    }
    return 'snacks';
  }
}
