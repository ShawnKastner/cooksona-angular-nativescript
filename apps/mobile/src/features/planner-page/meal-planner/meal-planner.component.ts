import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ChefHat, Plus } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { NativeScriptCommonModule } from '@nativescript/angular';

@Component({
  selector: 'ns-meal-planner',
  templateUrl: './meal-planner.component.html',
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
})
export class MealPlannerComponent {
  icons = {
    ChefHat,
    Plus,
  } as const;
}
