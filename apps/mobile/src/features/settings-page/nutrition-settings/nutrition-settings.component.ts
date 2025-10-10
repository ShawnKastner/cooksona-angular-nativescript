import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { ChevronLeft, ChevronRight } from '@cooksona/constants/icons';

@Component({
  selector: 'ns-nutrition-settings',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './nutrition-settings.component.html',
})
export class NutritionSettingsComponent {
  protected readonly icons = {
    ChevronLeft,
    ChevronRight,
  } as const;

  // Hardcoded Ernährungseinstellungen
  protected dietPreferences = signal('Keine Angabe');
  protected allergies = signal('Keine Angabe');
  protected numberOfPeople = signal('2');
  protected preferredMeals = signal('Frühstück, Mittagessen, Abendessen');

  constructor(private routerExtensions: RouterExtensions) {}

  protected goBack() {
    this.routerExtensions.back();
  }

  protected editDietPreferences() {
    console.log('Edit diet preferences');
    // TODO: Navigate to diet preferences page
  }

  protected editAllergies() {
    console.log('Edit allergies');
    // TODO: Navigate to allergies page
  }

  protected editNumberOfPeople() {
    this.routerExtensions.navigate(['/edit-number-of-people']);
  }

  protected editPreferredMeals() {
    this.routerExtensions.navigate(['/edit-preferred-meals']);
  }
}
