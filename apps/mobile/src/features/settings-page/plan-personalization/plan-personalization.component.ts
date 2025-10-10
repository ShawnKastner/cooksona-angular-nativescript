import { Component, NO_ERRORS_SCHEMA, OnInit, inject } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { ChevronLeft, ChevronRight } from '@cooksona/constants/icons';
import { ProfileSettingsStore } from '@cooksona/models';

@Component({
  selector: 'ns-plan-personalization',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './plan-personalization.component.html',
})
export class PlanPersonalizationComponent implements OnInit {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly store = inject(ProfileSettingsStore);

  protected readonly icons = {
    ChevronLeft,
    ChevronRight,
  } as const;

  // Get values from store
  protected readonly favoriteIngredients = this.store.favoriteIngredients$;
  protected readonly noGoIngredients = this.store.excludedIngredients$;
  protected readonly kitchenEquipment = this.store.kitchenEquipmentDisplay$;
  protected readonly loading = this.store.loading$;

  ngOnInit() {
    this.store.loadPlanPersonalization();
  }

  protected goBack() {
    this.routerExtensions.back();
  }

  protected editFavoriteIngredients() {
    this.routerExtensions.navigate(['/edit-favorite-ingredients']);
  }

  protected editNoGoIngredients() {
    this.routerExtensions.navigate(['/edit-excluded-ingredients']);
  }

  protected editKitchenEquipment() {
    this.routerExtensions.navigate(['/edit-kitchen-equipment']);
  }
}
