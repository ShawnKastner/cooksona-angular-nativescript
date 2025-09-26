import { Component, NO_ERRORS_SCHEMA, input, output } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { ArrowLeft, Shuffle, Wand2 } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Recipe } from '@cooksona/models';

@Component({
  selector: 'ns-recipe-detail-view',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: `./recipe-detail-view.component.html`,
})
export class RecipeDetailViewComponent {
  recipe = input<Recipe | null>(null);
  close = output<void>();

  icons = {
    ArrowLeft,
    Shuffle,
    Wand2,
  } as const;

  closeDetailView() {
    this.close.emit();
  }
}
