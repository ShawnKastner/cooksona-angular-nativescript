import { Component, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import {
  ArrowLeft,
  BookHeart,
  Check,
  Sparkles,
  Wand2,
} from '@cooksona/constants/icons';
import { Recipe } from '@cooksona/models';
import {
  NativeScriptFormsModule,
  RouterExtensions,
} from '@nativescript/angular';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PlannerStore } from '../planner.store';

@Component({
  selector: 'ns-transform-recipe',
  templateUrl: './transform-recipe.component.html',
  standalone: true,
  imports: [SvgToDataUriPipe, ReactiveFormsModule, NativeScriptFormsModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TransformRecipeComponent {
  private readonly plannerStore = inject(PlannerStore);

  isSaving = signal(false);

  recipeToTransform = signal(<Recipe | null>null);
  transformatedRecipe = signal<Recipe | null>(null);
  isTransforming = this.plannerStore.loading;
  form!: FormGroup;

  constructor(
    private router: RouterExtensions,
    private fb: FormBuilder,
  ) {
    const nav = this.router.router.currentNavigation();
    const state = (nav?.extras?.state as any) ?? {};
    const recipeFromState = state.recipe as Recipe | undefined;

    if (recipeFromState) {
      this.recipeToTransform.set(recipeFromState);
    }

    this.form = this.fb.group({
      transformationWish: [''],
    });
  }

  icons = {
    ArrowLeft,
    Sparkles,
    Wand2,
    Check,
    BookHeart,
  };

  suggestionChips = signal([
    'Vegan',
    'Leichter',
    'Größere Portion',
    'Ohne Zwiebeln',
  ]);

  onChipSelected(chip: string) {
    return this.form.patchValue({ transformationWish: chip });
  }

  async transformRecipe() {
    const recipe = this.recipeToTransform();
    if (!recipe) {
      return;
    }
    try {
      const transformedRecipe = await this.plannerStore.transformRecipe(
        recipe,
        this.form.value.transformationWish,
      );
      this.transformatedRecipe.set(transformedRecipe ?? null);
    } catch (error) {
      console.error('Error transforming recipe:', error);
    }
  }

  async saveTransformedRecipe(action: 'saveAsCopy' | 'updateInPlan') {
    const transformedRecipe = this.transformatedRecipe();
    const originalId = this.recipeToTransform()?.id;
    this.isSaving.set(true);
    if (!transformedRecipe || !originalId) {
      return;
    }
    try {
      const activePlanId = this.plannerStore.activePlanId();

      if (activePlanId) {
        await this.plannerStore.saveTransformedRecipe(
          originalId,
          transformedRecipe,
          action,
          activePlanId,
        );
        await this.router.navigate(['/home', 'plan']);
      }
    } catch (error) {
      console.error('Error saving transformed recipe:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack() {
    this.router.back();
  }
}
