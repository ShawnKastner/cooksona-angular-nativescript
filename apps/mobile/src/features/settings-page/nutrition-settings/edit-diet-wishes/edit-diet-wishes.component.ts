import {
  Component,
  NO_ERRORS_SCHEMA,
  signal,
  OnInit,
  inject,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { ProfileSettingsStore } from '@cooksona/models';
import { prompt } from '@nativescript/core';

@Component({
  selector: 'ns-edit-diet-wishes',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-diet-wishes.component.html',
})
export class EditDietWishesComponent implements OnInit {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly store = inject(ProfileSettingsStore);

  protected dietWishes = signal<string[]>([]);

  ngOnInit() {
    const current = this.store.dietWishes$();
    if (current && current !== 'Keine Angabe') {
      // Split by common separators (comma, semicolon, newline)
      const wishes = current
        .split(/[,;\n]+/)
        .map((w) => w.trim())
        .filter((w) => w.length > 0);
      this.dietWishes.set(wishes);
    }
  }

  protected async addWish() {
    const result = await prompt({
      title: 'Diät-Wunsch hinzufügen',
      message: 'Was für einen Ernährungswunsch hast du?',
      okButtonText: 'Hinzufügen',
      cancelButtonText: 'Abbrechen',
      inputType: 'text',
    });

    if (result.result && result.text && result.text.trim().length > 0) {
      const newWish = result.text.trim();
      this.dietWishes.update((wishes) => [...wishes, newWish]);
    }
  }

  protected removeWish(index: number) {
    this.dietWishes.update((wishes) => wishes.filter((_, i) => i !== index));
  }

  protected async save() {
    try {
      const wishes = this.dietWishes();
      const wishesText = wishes.length > 0 ? wishes.join(', ') : '';

      await this.store.updateDietWishes(wishesText);
      this.routerExtensions.back();
    } catch (error) {
      console.error('Error saving diet wishes:', error);
    }
  }

  protected cancel() {
    this.routerExtensions.back();
  }
}
