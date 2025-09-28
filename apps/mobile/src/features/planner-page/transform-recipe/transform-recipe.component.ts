import {
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  signal,
  OnInit,
} from '@angular/core';
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
export class TransformRecipeComponent implements OnInit {
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
    const recipeFromState = (nav?.extras?.state as any)?.recipe as
      | Recipe
      | undefined;
    if (recipeFromState) {
      this.recipeToTransform.set(recipeFromState);
    }
    // If navigation state provides a planId/originalRecipeId, capture it for saving
    try {
      const navState = (nav?.extras?.state as any) ?? {};
      const planIdFromState = navState.planId as string | undefined;
      const originalIdFromState = navState.originalRecipeId as
        | string
        | undefined;
      if (planIdFromState) {
        // set activePlanId in store so saveFlow can find it
        try {
          // directly set activePlanId signal if available
          if (!this.plannerStore.activePlanId()) {
            this.plannerStore.activePlanId.set(planIdFromState);
          }
        } catch (e) {
          // ignore if cannot set
        }
        // attach to recipeToTransform metadata if needed
      }
      if (originalIdFromState && !recipeFromState) {
        // if we only got ids, try to look up recipe from active plan later
      }
    } catch (e) {
      // ignore
    }

    this.form = this.fb.group({
      transformationWish: [''],
    });
  }

  async ngOnInit(): Promise<void> {
    // Ensure plans are loaded so activePlanId is available when saving
    try {
      if (!this.plannerStore.activePlanId()) {
        await this.plannerStore.load();
      }
    } catch (e) {
      console.warn('Failed to load planner store on transform page', e);
    }
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
    const original = this.recipeToTransform();
    if (!transformedRecipe) {
      return;
    }
    try {
      // pass the active plan id explicitly and await the save
      const activePlanId = this.plannerStore.activePlanId();
      console.log(
        'Saving transformed recipe, planId=',
        activePlanId,
        'originalId=',
        original?.id,
      );
      if (!activePlanId) {
        console.error('No active plan id available; aborting updateInPlan');
        // TODO: Show user warning
        return;
      }
      await this.plannerStore.saveTransformedRecipe(transformedRecipe, {
        updateInPlan: true,
        planId: activePlanId ?? undefined,
        originalRecipeId: original?.id ?? undefined,
      });
      await this.router.navigate(['/home', 'plan']);
    } catch (error) {
      console.error('Error saving transformed recipe:', error);
    }
  }

  goBack() {
    this.router.back();
  }
}
