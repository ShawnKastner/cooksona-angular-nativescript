import { Component, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { ArrowLeft, Check, Sparkles, Wand2 } from '@cooksona/constants/icons';
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
    const planIdFromState = state.planId as string | undefined;
    const originalIdFromState = state.originalRecipeId as string | undefined;

    if (recipeFromState) {
      this.recipeToTransform.set(recipeFromState);
    }
    // Wenn die Seite mit planId geöffnet wurde, setze die aktive Plan-ID im Store
    if (planIdFromState) {
      this.plannerStore.setActivePlan(planIdFromState);
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

  async saveTransformedRecipe() {
    const transformedRecipe = this.transformatedRecipe();
    const originalId = this.recipeToTransform()?.id;

    if (!transformedRecipe || !originalId) {
      return;
    }
    try {
      // pass the active plan id explicitly and await the save
      const activePlanId = this.plannerStore.activePlanId();
      console.log(
        'Saving transformed recipe, planId=',
        activePlanId,
        'originalId=',
        originalId,
      );
      if (!activePlanId) {
        console.error('No active plan id available; aborting updateInPlan');
        // TODO: Show user warning
        return;
      }
      await this.plannerStore.saveTransformedRecipe(
        originalId,
        transformedRecipe,
        'updateInPlan',
        activePlanId,
      );
      await this.router.navigate(['/home', 'plan']);
    } catch (error) {
      console.error('Error saving transformed recipe:', error);
    }
  }

  goBack() {
    this.router.back();
  }
}
