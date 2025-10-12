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
  selector: 'ns-edit-allergies',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-allergies.component.html',
})
export class EditAllergiesComponent implements OnInit {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly store = inject(ProfileSettingsStore);

  protected allergies = signal<string[]>([]);

  ngOnInit() {
    const current = this.store.allergies$();
    if (current && current !== 'Keine Angabe') {
      // Split by common separators (comma, semicolon, newline)
      const allergyList = current
        .split(/[,;\n]+/)
        .map((a) => a.trim())
        .filter((a) => a.length > 0);
      this.allergies.set(allergyList);
    }
  }

  protected async addAllergy() {
    const result = await prompt({
      title: 'Allergie hinzufügen',
      message: 'Welche Allergie oder Unverträglichkeit hast du?',
      okButtonText: 'Hinzufügen',
      cancelButtonText: 'Abbrechen',
      inputType: 'text',
    });

    if (result.result && result.text && result.text.trim().length > 0) {
      const newAllergy = result.text.trim();
      this.allergies.update((allergies) => [...allergies, newAllergy]);
    }
  }

  protected removeAllergy(index: number) {
    this.allergies.update((allergies) =>
      allergies.filter((_, i) => i !== index),
    );
  }

  protected async save() {
    try {
      const allergyList = this.allergies();
      const allergiesText =
        allergyList.length > 0 ? allergyList.join(', ') : '';

      await this.store.updateAllergies(allergiesText);
      this.routerExtensions.back();
    } catch (error) {
      console.error('Error saving allergies:', error);
    }
  }

  protected cancel() {
    this.routerExtensions.back();
  }
}
