import {
  Component,
  NO_ERRORS_SCHEMA,
  ViewContainerRef,
  signal,
} from '@angular/core';
import { ChefHat, Plus } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import {
  ModalDialogService,
  NativeScriptCommonModule,
} from '@nativescript/angular';
import { MealPlanFormComponent } from '../meal-plan-form/meal-plan-form.component';

@Component({
  selector: 'ns-meal-planner',
  templateUrl: './meal-planner.component.html',
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
})
export class MealPlannerComponent {
  openAddMealPlan = signal(false);

  icons = {
    ChefHat,
    Plus,
  } as const;

  constructor(
    private modalService: ModalDialogService,
    private vcRef: ViewContainerRef,
  ) {}

  async openMealPlanForm() {
    try {
      await this.modalService.showModal(MealPlanFormComponent, {
        viewContainerRef: this.vcRef,
        context: {},
        fullscreen: true,
        animated: true,
        stretched: true,
      });
    } catch (e) {
      console.error('Failed to open meal plan form modal', e);
    }
  }
}
