import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { ProfileSettingsStore } from '@cooksona/models';
import { prompt } from '@nativescript/core';

@Component({
  selector: 'ns-edit-excluded-ingredients',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-excluded-ingredients.component.html',
})
export class EditExcludedIngredientsComponent implements OnInit {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly store = inject(ProfileSettingsStore);

  protected readonly ingredients = signal<string[]>([]);

  ngOnInit() {
    const currentValue = this.store.excludedIngredients$();
    if (Array.isArray(currentValue)) {
      this.ingredients.set([...currentValue]);
    } else if (typeof currentValue === 'string' && currentValue.length > 0) {
      // Handle string format by splitting
      this.ingredients.set(
        currentValue
          .split(',')
          .map((i) => i.trim())
          .filter((i) => i.length > 0),
      );
    }
  }

  protected async addIngredient() {
    const result = await prompt({
      title: 'No-Go Zutat hinzufügen',
      message: 'Welche Zutat möchtest du ausschließen?',
      okButtonText: 'Hinzufügen',
      cancelButtonText: 'Abbrechen',
      inputType: 'text',
    });

    if (result.result && result.text && result.text.trim().length > 0) {
      const newItem = result.text.trim();
      this.ingredients.update((items) => [...items, newItem]);
    }
  }

  protected removeIngredient(index: number) {
    this.ingredients.update((items) => items.filter((_, i) => i !== index));
  }

  protected async save() {
    try {
      const ingredientList = this.ingredients();

      await this.store.updateExcludedIngredients(ingredientList);
      this.routerExtensions.back();
    } catch (error) {
      console.error('Failed to save excluded ingredients:', error);
    }
  }

  protected cancel() {
    this.routerExtensions.back();
  }
}
