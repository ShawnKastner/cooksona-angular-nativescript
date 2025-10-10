import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { ChevronLeft, ChevronRight } from '@cooksona/constants/icons';

@Component({
  selector: 'ns-plan-personalization',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './plan-personalization.component.html',
})
export class PlanPersonalizationComponent {
  protected readonly icons = {
    ChevronLeft,
    ChevronRight,
  } as const;

  // Hardcoded Plan-Personalisierung
  protected favoriteIngredients = signal('Keine Angabe');
  protected noGoIngredients = signal('Keine Angabe');
  protected kitchenEquipment = signal('Standard');

  constructor(private routerExtensions: RouterExtensions) {}

  protected goBack() {
    this.routerExtensions.back();
  }

  protected editFavoriteIngredients() {
    console.log('Edit favorite ingredients');
    // TODO: Implement edit dialog
  }

  protected editNoGoIngredients() {
    console.log('Edit no-go ingredients');
    // TODO: Implement edit dialog
  }

  protected editKitchenEquipment() {
    console.log('Edit kitchen equipment');
    // TODO: Implement edit dialog
  }
}
