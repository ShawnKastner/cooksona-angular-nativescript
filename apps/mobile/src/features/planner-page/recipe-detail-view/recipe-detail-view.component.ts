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
import { ArrowLeft, Shuffle, Users, Wand2 } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Recipe } from '@cooksona/models';
import { ActivatedRoute, Router } from '@angular/router';
import { PlannerStore } from '../planner.store';
import { DailyPlan } from '@cooksona/models';
import { CookbookStore } from '../../cookbook-page/cookbook.store';

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
  private readonly cookbookStore = inject(CookbookStore, { optional: true });

  private readonly routeRecipe = signal<Recipe | null>(null);
  readonly displayRecipe = computed(() => this.recipe() ?? this.routeRecipe());
  private readonly dayName = signal<string | null>(null);
  private readonly mealKey = signal<string | null>(null);
  private readonly source = signal<'mealPlan' | 'cookbook'>('mealPlan');

  // Computed property to determine if swap button should be shown
  readonly showSwapButton = computed(() => this.source() === 'mealPlan');

  icons = {
    ArrowLeft,
    Shuffle,
    Wand2,
    Users,
  } as const;

  constructor() {
    const nav = this.router.currentNavigation();
    try {
      const stateRecipe = (nav?.extras?.state as any)?.recipe as
        | Recipe
        | undefined;
      const stateDay = (nav?.extras?.state as any)?.dayName as
        | string
        | undefined;
      const stateKey = (nav?.extras?.state as any)?.mealKey as
        | string
        | undefined;
      const stateSource = (nav?.extras?.state as any)?.source as
        | 'cookbook'
        | 'mealPlan'
        | undefined;

      // Set the source based on navigation state
      if (stateSource) {
        this.source.set(stateSource);
      }

      if (stateRecipe) {
        this.routeRecipe.set(stateRecipe);
        if (stateDay) this.dayName.set(stateDay);
        if (stateKey) this.mealKey.set(stateKey);
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
        // Try to derive context (day + mealKey) from active plan
        if (active && found) {
          const ctx = this.findMealContext(active.days as any, id);
          if (ctx) {
            this.dayName.set(ctx.dayName);
            this.mealKey.set(ctx.mealKey);
          }
        }
      } catch (e) {
        console.warn('[RecipeDetail] lookup by id failed', e);
      }
    }
  }

  private findMealContext(
    days: DailyPlan[],
    recipeId: string,
  ): { dayName: string; mealKey: string } | null {
    const KEYS: Array<keyof DailyPlan> = [
      'breakfast',
      'lunch',
      'dinner',
      'snack',
      'dessert',
    ];
    for (const d of days) {
      for (const key of KEYS) {
        if (key === 'day') continue;
        const meal = (d as any)[key] as Recipe | undefined;
        if (meal?.id === recipeId) {
          return { dayName: d.day, mealKey: key as string };
        }
      }
    }
    return null;
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

  navigateToTransformRecipe() {
    const recipe = this.displayRecipe();
    if (recipe) {
      this.router.navigate(['/home', 'transform-recipe', recipe.id], {
        state: { recipe, source: this.source() },
      });
    }
  }

  swappingMeal() {
    const recipe = this.displayRecipe();
    if (!recipe) return;

    // Prefer context from navigation state; otherwise derive from active plan
    let day = this.dayName();
    let key = this.mealKey();
    if ((!day || !key) && recipe?.id && this.store?.activePlan()) {
      const ctx = this.findMealContext(
        this.store.activePlan()!.days as unknown as DailyPlan[],
        recipe.id,
      );
      if (ctx) {
        day = ctx.dayName;
        key = ctx.mealKey;
        this.dayName.set(day);
        this.mealKey.set(key);
      }
    }
    if (!day || !key) {
      console.warn('[RecipeDetail] swap context missing (day/mealKey)');
      return;
    }

    this.store?.swappingMealId.set(recipe.id);

    try {
      this.router.navigate(['/home', 'plan']).then(
        () => {
          (async () => {
            try {
              await this.store?.handleSwapMeal?.(day!, key!, recipe);
            } catch (e) {
              console.warn('[RecipeDetail] handleSwapMeal failed', e);
            } finally {
              // store.handleSwapMeal clears swappingMealId in finally
            }
          })();
        },
        (navErr) => {
          console.warn('[RecipeDetail] navigate to plan failed', navErr);
        },
      );
    } catch (e) {
      console.warn('[RecipeDetail] navigate to plan failed', e);
    }
  }
}
