import {
  Component,
  NO_ERRORS_SCHEMA,
  input,
  output,
  inject,
  signal,
  computed,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { ArrowLeft, Shuffle, Wand2 } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Recipe } from '@cooksona/models';
import { ActivatedRoute, Router } from '@angular/router';
import { PlannerStore } from '../planner.store';

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

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(PlannerStore, { optional: true });

  private readonly routeRecipe = signal<Recipe | null>(null);
  readonly displayRecipe = computed(() => this.recipe() ?? this.routeRecipe());

  icons = {
    ArrowLeft,
    Shuffle,
    Wand2,
  } as const;

  constructor() {
    const nav = this.router.currentNavigation();
    try {
      const stateRecipe = (nav?.extras?.state as any)?.recipe as
        | Recipe
        | undefined;
      if (stateRecipe) {
        this.routeRecipe.set(stateRecipe);
        return;
      }
    } catch (e) {
      console.warn('[RecipeDetail] reading navigation state failed', e);
    }
    const id = this.route.snapshot.paramMap.get('id');
    if (id && !this.recipe()) {
      // Try lookup from active plan if available
      try {
        const active = this.store?.activePlan();
        const found = active
          ? active.days
              .flatMap((d: any) => [
                d.breakfast,
                d.lunch,
                d.dinner,
                d.snack,
                d.dessert,
              ])
              .filter(Boolean)
              .find((r: any) => r?.id === id)
          : null;
        if (found) this.routeRecipe.set(found as Recipe);
      } catch (e) {
        console.warn('[RecipeDetail] lookup by id failed', e);
      }
    }
  }

  closeDetailView() {
    // If embedded, still emit for legacy listeners
    try {
      this.close.emit();
    } catch (e) {
      console.warn('[RecipeDetail] close output emit failed', e);
    }
    // Prefer router back to keep URL in sync
    try {
      this.router.navigate(['/home', 'plan']);
    } catch (e) {
      console.warn('[RecipeDetail] navigate back failed', e);
    }
  }
}
