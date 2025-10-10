import {
  Component,
  NO_ERRORS_SCHEMA,
  signal,
  OnInit,
  inject,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { ProfileSettingsStore, PreferredMeal } from '@cooksona/models';

interface MealOption {
  id: PreferredMeal;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'ns-edit-preferred-meals',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-preferred-meals.component.html',
  styles: [
    `
      Switch {
        background-color: #4a6c6f;
        off-background-color: #9ca3af;
      }
    `,
  ],
})
export class EditPreferredMealsComponent implements OnInit {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly store = inject(ProfileSettingsStore);

  protected readonly meals = signal<MealOption[]>([
    { id: PreferredMeal.BREAKFAST, label: 'Frühstück', selected: false },
    { id: PreferredMeal.LUNCH, label: 'Mittagessen', selected: false },
    { id: PreferredMeal.DINNER, label: 'Abendessen', selected: false },
    { id: PreferredMeal.SNACKS, label: 'Snacks', selected: false },
  ]);

  ngOnInit() {
    // Load current values from store - use effect to react to changes
    const currentSettings = this.store.nutrition$();
    if (currentSettings) {
      const selectedMeals = currentSettings.preferredMeals || [
        PreferredMeal.BREAKFAST,
        PreferredMeal.LUNCH,
        PreferredMeal.DINNER,
      ];

      // Create new array with updated selected state
      const updatedMeals = [
        {
          id: PreferredMeal.BREAKFAST,
          label: 'Frühstück',
          selected: selectedMeals.includes(PreferredMeal.BREAKFAST),
        },
        {
          id: PreferredMeal.LUNCH,
          label: 'Mittagessen',
          selected: selectedMeals.includes(PreferredMeal.LUNCH),
        },
        {
          id: PreferredMeal.DINNER,
          label: 'Abendessen',
          selected: selectedMeals.includes(PreferredMeal.DINNER),
        },
        {
          id: PreferredMeal.SNACKS,
          label: 'Snacks',
          selected: selectedMeals.includes(PreferredMeal.SNACKS),
        },
      ];

      this.meals.set(updatedMeals);
    }
  }

  protected toggleMeal(mealId: PreferredMeal, value?: boolean) {
    const currentMeals = this.meals();
    const updatedMeals = currentMeals.map((meal) =>
      meal.id === mealId
        ? { ...meal, selected: value !== undefined ? value : !meal.selected }
        : meal,
    );
    this.meals.set(updatedMeals);
  }

  protected onSwitchChange(args: any, mealId: PreferredMeal) {
    this.toggleMeal(mealId, args.value);
  }

  protected async save() {
    try {
      const selectedMeals = this.meals()
        .filter((m) => m.selected)
        .map((m) => m.id);

      await this.store.updatePreferredMeals(selectedMeals);
      this.routerExtensions.back();
    } catch (error) {
      console.error('Failed to save preferred meals:', error);
    }
  }

  protected cancel() {
    this.routerExtensions.back();
  }
}
