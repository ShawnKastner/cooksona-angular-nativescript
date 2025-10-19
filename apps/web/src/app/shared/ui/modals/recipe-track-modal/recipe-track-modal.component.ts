import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SvgInjectDirective } from '../../../directives/svg-inject.directive';
import { FocusTrapDirective } from '../../focus-trap.directive';
import { icons } from '@cooksona/constants/icons';
import {
  clampPortion,
  getNutritionTotals,
  multiplyNutrition,
  roundCalories,
  roundMacro,
  type NutritionTotals,
} from '@cooksona/models';
import type { Recipe } from '@cooksona/models/recipe.models';
import type { MealEntry } from '@cooksona/api';
import { HealthStore } from '@cooksona/health';
import { SnackbarService } from '../../snackbar/snackbar.service';

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
  selector: 'app-recipe-track-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective, FocusTrapDirective],
  templateUrl: './recipe-track-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeTrackModalComponent implements OnChanges {
  @Input() open = false;
  @Input() recipe: Recipe | null = null;
  @Input() mealEntry: MealEntry | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() tracked = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  private readonly healthStore = inject(HealthStore);
  private readonly snackbar = inject(SnackbarService);

  protected readonly icons = icons;
  protected readonly mealTypes = MEAL_TYPES;
  protected readonly portion = signal(1);
  protected readonly mealType = signal<MealType>(this.getDefaultMealType());
  protected readonly selectedDate = signal<string>(this.getTodayDate());
  protected readonly selectedTime = signal<string>(this.getCurrentTime());
  protected readonly baseNutrition = signal<NutritionTotals | null>(null);
  protected readonly hasNutrition = computed(
    () => this.baseNutrition() !== null,
  );
  protected readonly totals = computed(() => {
    const base = this.baseNutrition();
    const portion = this.portion();
    if (!base) return null;
    return multiplyNutrition(base, portion);
  });
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected get isEditMode(): boolean {
    return !!this.mealEntry;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      (changes['open'] && this.open) ||
      changes['recipe'] ||
      changes['mealEntry']
    ) {
      this.resetViewState();
    }
  }

  protected handleClose(): void {
    if (!this.loading()) this.close.emit();
  }

  protected onPortionInput(event: Event): void {
    const target = event.target as HTMLInputElement | null;
    if (!target) return;
    const value = Number.parseFloat(target.value);
    const clamped = clampPortion(value);
    this.portion.set(clamped);
    if (Number.isNaN(value) || value <= 0) {
      this.error.set(
        'Bitte gib eine gültige Portionsanzahl zwischen 0,25 und 10 ein.',
      );
    } else {
      this.error.set(null);
    }
  }

  protected adjustPortion(delta: number): void {
    const current = this.portion();
    const next = clampPortion(current + delta);
    this.portion.set(next);
  }

  protected onMealTypeChange(key: MealType): void {
    this.mealType.set(key);
  }

  protected async save(): Promise<void> {
    const recipe = this.recipe;
    const totals = this.totals();
    const base = this.baseNutrition();
    if (!recipe || !totals || !base) {
      this.error.set(
        'Für dieses Rezept fehlen Nährwertangaben. Bitte ergänze sie vor dem Tracken.',
      );
      return;
    }

    const portion = this.portion();
    if (!Number.isFinite(portion) || portion <= 0) {
      this.error.set(
        'Bitte gib eine gültige Portionsanzahl zwischen 0,25 und 10 ein.',
      );
      return;
    }

    const selectedDate = this.selectedDate();
    if (!selectedDate) {
      this.error.set('Bitte wähle ein gültiges Datum aus.');
      return;
    }
    const selectedTime = this.selectedTime() || '00:00';
    const validationDate = new Date(`${selectedDate}T${selectedTime}`);
    if (Number.isNaN(validationDate.getTime())) {
      this.error.set('Bitte wähle eine gültige Uhrzeit aus.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.mealEntry) {
        await this.healthStore.updateMeal(this.mealEntry.id, {
          date: selectedDate,
          name: recipe.name,
          sourceType: 'recipe',
          mealType: this.mealType(),
          recipeId: recipe.id,
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          portions: portion,
        });
        this.snackbar.success('Tracking-Eintrag wurde aktualisiert.');
        this.updated.emit();
      } else {
        await this.healthStore.createMeal({
          date: selectedDate,
          name: recipe.name,
          sourceType: 'recipe',
          mealType: this.mealType(),
          recipeId: recipe.id,
          calories: totals.calories,
          protein: totals.protein,
          carbs: totals.carbs,
          fat: totals.fat,
          portions: portion,
        });
        this.snackbar.success(
          'Rezept wurde zum Ernährungstagebuch hinzugefügt.',
        );
        this.tracked.emit();
      }
    } catch (e: any) {
      const message =
        e?.message ??
        'Das Rezept konnte nicht gespeichert werden. Bitte versuche es später erneut.';
      this.error.set(message);
      this.snackbar.error(message);
    } finally {
      this.loading.set(false);
    }
  }

  protected displayCalories(): string {
    const totals = this.totals();
    if (!totals) return '–';
    return `${roundCalories(totals.calories)} kcal`;
  }

  protected displayMacro(field: keyof NutritionTotals): string {
    const totals = this.totals();
    if (!totals) return '–';
    return `${roundMacro(totals[field])} g`;
  }

  protected onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    this.selectedDate.set(input.value);
  }

  protected onTimeChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input) return;
    this.selectedTime.set(input.value);
  }

  private resetViewState(): void {
    if (!this.open) return;
    const meal = this.mealEntry;
    const recipe = this.recipe;
    const base = this.computeBaseNutrition(recipe, meal);
    this.baseNutrition.set(base);
    this.error.set(null);
    this.loading.set(false);
    if (meal) {
      this.portion.set(this.getInitialPortion(meal, base));
      this.mealType.set(meal.mealType);
      this.selectedDate.set(meal.date ?? this.getTodayDate());
      this.selectedTime.set(this.getCurrentTime());
    } else {
      this.portion.set(1);
      this.mealType.set(this.getDefaultMealType());
      this.selectedDate.set(this.getTodayDate());
      this.selectedTime.set(this.getCurrentTime());
    }
  }

  private getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private getCurrentTime(): string {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  private getDefaultMealType(): MealType {
    const now = new Date();
    const totalMinutes = now.getHours() * 60 + now.getMinutes();
    if (totalMinutes >= 5 * 60 && totalMinutes <= 10 * 60 + 30) {
      return 'breakfast';
    }
    if (totalMinutes > 10 * 60 + 30 && totalMinutes <= 15 * 60) {
      return 'lunch';
    }
    if (totalMinutes > 15 * 60 && totalMinutes <= 21 * 60) {
      return 'dinner';
    }
    return 'snacks';
  }

  private derivePortionFromTotals(
    meal: MealEntry,
    base: NutritionTotals,
  ): number {
    if (Number.isFinite(meal.portions) && (meal.portions ?? 0) > 0) {
      return meal.portions as number;
    }
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

  private getInitialPortion(
    meal: MealEntry,
    base: NutritionTotals | null,
  ): number {
    if (Number.isFinite(meal.portions) && (meal.portions ?? 0) > 0) {
      return clampPortion(meal.portions as number);
    }
    if (base) {
      return clampPortion(this.derivePortionFromTotals(meal, base));
    }
    return 1;
  }
}
