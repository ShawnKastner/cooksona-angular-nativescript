import { Component, NO_ERRORS_SCHEMA, OnInit, inject } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { ChevronLeft, ChevronRight } from '@cooksona/constants/icons';
import { ProfileSettingsStore } from '@cooksona/models';

@Component({
  selector: 'ns-nutrition-settings',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './nutrition-settings.component.html',
})
export class NutritionSettingsComponent implements OnInit {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly store = inject(ProfileSettingsStore);

  protected readonly icons = {
    ChevronLeft,
    ChevronRight,
  } as const;

  // Get values from store
  protected readonly dietPreferences = this.store.dietWishes$;
  protected readonly allergies = this.store.allergies$;
  protected readonly numberOfPeople = this.store.personCount$;
  protected readonly preferredMeals = this.store.preferredMeals$;
  protected readonly loading = this.store.loading$;

  ngOnInit() {
    this.store.loadNutritionSettings();
  }

  protected goBack() {
    this.routerExtensions.back();
  }

  protected editDietPreferences() {
    this.routerExtensions.navigate(['/edit-diet-wishes']);
  }

  protected editAllergies() {
    this.routerExtensions.navigate(['/edit-allergies']);
  }

  protected editNumberOfPeople() {
    this.routerExtensions.navigate(['/edit-number-of-people']);
  }

  protected editPreferredMeals() {
    this.routerExtensions.navigate(['/edit-preferred-meals']);
  }
}
