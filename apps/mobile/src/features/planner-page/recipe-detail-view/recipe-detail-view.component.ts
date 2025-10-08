import {
  Component,
  NO_ERRORS_SCHEMA,
  input,
  output,
  inject,
  signal,
  computed,
} from '@angular/core';
import {
  NativeScriptCommonModule,
  RouterExtensions,
} from '@nativescript/angular';
import {
  ArrowLeft,
  Heart,
  Shuffle,
  Users,
  Wand2,
} from '@cooksona/constants/icons';
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
  private readonly routerExt = inject(RouterExtensions);
  private readonly store = inject(PlannerStore, { optional: true });
  private readonly cookbookStore = inject(CookbookStore);

  private readonly routeRecipe = signal<Recipe | null>(null);
  readonly displayRecipe = computed(() => this.recipe() ?? this.routeRecipe());
  private readonly dayName = signal<string | null>(null);
  private readonly mealKey = signal<string | null>(null);
  private readonly source = signal<'mealPlan' | 'cookbook'>('mealPlan');

  // Computed property to determine if swap button should be shown
  readonly showSwapButton = computed(() => this.source() === 'mealPlan');

  // Computed property to check if recipe is in cookbook
  readonly isInCookbook = computed(() => {
    const recipe = this.displayRecipe();
    if (!recipe?.id) return false;
    return this.cookbookStore.favoriteRecipeIds().has(String(recipe.id));
  });

  // Computed property for heart icon SVG with proper fill
  readonly heartIconSvg = computed(() => {
    const isFavorite = this.isInCookbook();
    if (isFavorite) {
      // Filled red heart
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
</svg>`;
    } else {
      // Outline gray heart
      return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
</svg>`;
    }
  });

  icons = {
    ArrowLeft,
    Heart,
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
    // Navigate back to the appropriate tab page with clearHistory
    if (this.source() === 'cookbook') {
      try {
        this.routerExt.navigate(['/home/cookbook'], { clearHistory: true });
      } catch (e) {
        console.warn('[RecipeDetail] navigate back failed', e);
      }
    } else {
      try {
        this.routerExt.navigate(['/home/plan'], { clearHistory: true });
      } catch (e) {
        console.warn('[RecipeDetail] navigate back failed', e);
      }
    }
  }

  navigateToTransformRecipe() {
    const recipe = this.displayRecipe();
    if (recipe) {
      this.router.navigate(['/transform-recipe', recipe.id], {
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

  async toggleCookbook() {
    const recipe = this.displayRecipe();
    if (!recipe) return;

    try {
      const isCurrentlyInCookbook = this.isInCookbook();
      if (isCurrentlyInCookbook) {
        // Remove from cookbook
        await this.cookbookStore.removeRecipe(String(recipe.id));
      } else {
        // Add to cookbook
        await this.cookbookStore.addRecipe(recipe);
      }
    } catch (e) {
      console.warn('[RecipeDetail] toggleCookbook failed', e);
    }
  }
}
