import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';

interface MealOption {
  id: string;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'ns-edit-preferred-meals',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-preferred-meals.component.html',
})
export class EditPreferredMealsComponent {
  protected meals = signal<MealOption[]>([
    { id: 'breakfast', label: 'Frühstück', selected: true },
    { id: 'lunch', label: 'Mittagessen', selected: true },
    { id: 'dinner', label: 'Abendessen', selected: true },
    { id: 'snack', label: 'Snacks', selected: false },
  ]);

  constructor(private routerExtensions: RouterExtensions) {
    // TODO: Load actual values from service/store
  }

  protected toggleMeal(mealId: string) {
    this.meals.update((meals) =>
      meals.map((meal) =>
        meal.id === mealId ? { ...meal, selected: !meal.selected } : meal,
      ),
    );
  }

  protected save() {
    const selectedMeals = this.meals().filter((m) => m.selected);
    console.log('Saving preferred meals:', selectedMeals);
    // TODO: Save to service/store
    this.routerExtensions.back();
  }

  protected cancel() {
    this.routerExtensions.back();
  }
}
