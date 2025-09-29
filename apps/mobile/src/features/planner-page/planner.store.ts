import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService, CookbookApiService, PlanApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';
import {
  MealPlan,
  ShoppingListItem,
  Ingredient,
  PlannerOptions,
  Recipe,
} from '@cooksona/models';
import { DailyPlan } from '@cooksona/models/plan.models';

export interface CategoryBlockUi {
  category: string;
  items: ShoppingListItem[];
}
type MealField = Exclude<keyof DailyPlan, 'day'>;
const MEAL_FIELDS: MealField[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert',
];

@Injectable({ providedIn: 'root' })
export class PlannerStore {
  private readonly planApi = inject(PlanApiService);
  private readonly apiService = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly cookbookApi = inject(CookbookApiService, { optional: true });

  // State
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly plans = signal<MealPlan[]>([]);
  readonly activePlanId = signal<string | null>(null);

  // Derive the current plan's creation date from the active plan so it's
  // always available to consumers without having to set it manually.
  readonly currentPlanDate = computed<string | null>(() => {
    const plan = this.activePlan();
    if (!plan) return null;
    // createdAt may come as string — normalize to Date
    try {
      return plan.createdAt;
    } catch {
      return null;
    }
  });

  mealPlanHistory = signal<MealPlan[]>([]);
  favoriteRecipeIds = signal<Set<string>>(new Set());
  swappingMealId = signal<string | null>(null);

  // Derived
  readonly activePlan = computed(() => {
    const id = this.activePlanId();
    if (!id) return null;
    return this.plans().find((p) => p.id === id) ?? null;
  });

  readonly shoppingList = computed<CategoryBlockUi[] | null>(() => {
    const plan = this.activePlan();
    if (!plan) return null;
    if (plan.categorizedShoppingList && plan.categorizedShoppingList.length) {
      return plan.categorizedShoppingList.map((c) => ({
        category: c.category,
        items: c.items ?? [],
      }));
    }
    if (plan.shoppingList && plan.shoppingList.length) {
      return [
        {
          category: 'Einkaufsliste',
          items: plan.shoppingList,
        },
      ];
    }
    return null;
  });

  private updatePlanInStores(updated: MealPlan) {
    const nextPlans = this.plans().map((p) =>
      p.id === updated.id ? updated : p,
    );

    this.plans.set(nextPlans);

    const nextHist = this.mealPlanHistory().map((p) =>
      p.id === updated.id ? updated : p,
    );
    this.mealPlanHistory.set(nextHist);
  }

  setActivePlan(planId: string | null) {
    this.activePlanId.set(planId);
  }

  // Whether the active plan has a categorized shopping list
  readonly isCategorized = computed<boolean>(() => {
    const plan = this.activePlan();
    return !!(
      plan &&
      plan.categorizedShoppingList &&
      plan.categorizedShoppingList.length
    );
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const all = await this.planApi.getPlansForUser();
      this.plans.set(all ?? []);
      if (!this.activePlanId() && all && all.length) {
        this.activePlanId.set(all[0].id);
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Fehler beim Laden der Pläne');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleShoppingItem(
    itemId: string,
    checked: boolean,
    category?: string,
  ): Promise<void> {
    const currentPlans = this.plans();
    const activeId = this.activePlanId();
    if (!activeId) return;

    const idx = currentPlans.findIndex((p) => p.id === activeId);
    if (idx === -1) return;

    const original = currentPlans[idx];
    // Shallow clone plan and deep-clone list(s) we mutate
    const draft: MealPlan = {
      ...original,
      shoppingList: original.shoppingList
        ? original.shoppingList.map((i) => ({ ...i }))
        : [],
      categorizedShoppingList: original.categorizedShoppingList
        ? original.categorizedShoppingList.map((c) => ({
            category: c.category,
            items: c.items.map((i) => ({ ...i })),
          }))
        : null,
    };

    let mutated = false;
    if (draft.categorizedShoppingList && draft.categorizedShoppingList.length) {
      // If category provided, narrow search for perf
      const categories = category
        ? draft.categorizedShoppingList.filter((c) => c.category === category)
        : draft.categorizedShoppingList;
      for (const c of categories) {
        const item = c.items.find((i) => i.id === itemId);
        if (item) {
          item.checked = checked;
          mutated = true;
          break;
        }
      }
    } else if (draft.shoppingList && draft.shoppingList.length) {
      const item = draft.shoppingList.find((i) => i.id === itemId);
      if (item) {
        item.checked = checked;
        mutated = true;
      }
    }

    if (!mutated) return;

    // Optimistic update
    const next = [...currentPlans];
    next[idx] = draft;
    this.plans.set(next);

    // Persist
    try {
      if (
        draft.categorizedShoppingList &&
        draft.categorizedShoppingList.length
      ) {
        const updated = await this.planApi.saveCategorizedShoppingList(
          draft.id,
          draft.categorizedShoppingList,
        );
        if (updated) {
          const refreshed = [...this.plans()];
          const i = refreshed.findIndex((p) => p.id === updated.id);
          if (i !== -1) refreshed[i] = updated;
          this.plans.set(refreshed);
        }
      } else {
        const updated = await this.planApi.updateShoppingList(
          draft.id,
          draft.shoppingList,
        );
        if (updated) {
          const refreshed = [...this.plans()];
          const i = refreshed.findIndex((p) => p.id === updated.id);
          if (i !== -1) refreshed[i] = updated;
          this.plans.set(refreshed);
        }
      }
    } catch (e) {
      // Revert on failure
      console.error('Failed to persist shopping item toggle', e);
      this.plans.set(currentPlans);
    }
  }

  // Generate a new plan via AI and persist it, updating store state
  async generatePlan(options: PlannerOptions): Promise<MealPlan | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const isPro = this.auth.isProUser();
      const remaining = this.auth.getRemainingRequests();
      if (!isPro && remaining <= 0) {
        throw new Error(
          'Dein Freikontingent ist aufgebraucht. Upgrade erforderlich.',
        );
      }

      const baseMeals = {
        breakfast: !!options.meals?.breakfast,
        lunch: !!options.meals?.lunch,
        dinner: !!options.meals?.dinner,
        snack: !!options.meals?.snack,
        dessert: !!options.meals?.dessert,
      } as PlannerOptions['meals'];

      const planOptions: PlannerOptions = {
        ...options,
        planDays: Math.max(1, Math.min(options.planDays ?? 1, isPro ? 14 : 3)),
        planFocus: options.planFocus ?? 'ausgewogen',
        enableNutritionAnalysis: isPro
          ? (options.enableNutritionAnalysis ?? true)
          : false,
        gourmetMode: options.gourmetMode ?? false,
        meals: baseMeals,
        calories:
          isPro && (options.enableNutritionAnalysis ?? true)
            ? Number.isFinite(options.calories as number)
              ? (options.calories as number)
              : 2000
            : undefined,
      };

      const planData = await this.apiService.apiGenerateMealPlan<
        PlannerOptions,
        { days: DailyPlan[]; shoppingList: Ingredient[] }
      >(planOptions);

      if (!planData) {
        throw new Error('Plan konnte nicht generiert werden.');
      }

      const newPlan = await this.planApi.createPlanForUser({
        options: planOptions,
        days: planData.days,
        shoppingList: planData.shoppingList,
      });

      if (!newPlan) {
        throw new Error('Der Plan konnte nicht gespeichert werden.');
      }

      // Prepend and set active
      const updated = [newPlan, ...this.plans()];
      this.plans.set(updated);
      this.activePlanId.set(newPlan.id);
      if (!isPro) {
        // Best-effort request consumption to keep counters in sync
        try {
          await this.auth.consumeRequest();
        } catch {}
      }
      return newPlan;
    } catch (e: any) {
      this.error.set(
        e?.message ??
          'Der Plan konnte nicht erstellt werden. Bitte später erneut versuchen.',
      );
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  // Categorize the active plan's shopping list (flat) into departments and persist
  async categorizeActiveShoppingList(): Promise<boolean> {
    const plan = this.activePlan();
    if (!plan) return false;

    if (!plan.shoppingList || !plan.shoppingList.length) return false;

    try {
      const categorized = await this.apiService.apiCategorizeShoppingList<
        Ingredient,
        Array<{ category: string; items: Ingredient[] }>
      >(
        plan.shoppingList.map(({ name, amount, unit }) => ({
          name,
          amount,
          unit,
        })),
      );
      if (!categorized || !categorized.length) {
        throw new Error('Die Liste konnte nicht sortiert werden.');
      }

      const categorizedWithRefs = categorized.map(({ category, items }) => ({
        category,
        items: items.map((ing) => {
          const m = plan.shoppingList.find(
            (i) =>
              i.name === ing.name &&
              i.amount === ing.amount &&
              i.unit === ing.unit,
          );
          return m
            ? { ...m }
            : {
                id:
                  crypto?.randomUUID?.() ??
                  `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                checked: false,
                ...ing,
              };
        }),
      }));

      const updated = await this.planApi.saveCategorizedShoppingList(
        plan.id,
        categorizedWithRefs,
      );
      if (!updated) {
        throw new Error(
          'Die sortierte Einkaufsliste konnte nicht gespeichert werden.',
        );
      }

      // Replace the plan in store
      const next = this.plans().map((p) => (p.id === updated.id ? updated : p));
      this.plans.set(next);
      return true;
    } catch (e) {
      console.error('Failed to categorize shopping list', e);
      throw e;
    }
  }

  async transformRecipe(
    recipe: Recipe,
    modification: string,
    action: 'updateInPlan' | 'saveAsCopy' = 'saveAsCopy',
    originalRecipeId?: string,
  ): Promise<Recipe | null> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const isPro = this.auth.isProUser();
      const remaining = this.auth.getRemainingRequests();
      if (!isPro && remaining <= 0) {
        throw new Error(
          'Dein Freikontingent ist aufgebraucht. Upgrade erforderlich.',
        );
      }

      const transformed = await this.apiService.apiTransformRecipe<
        Recipe,
        Recipe
      >(recipe, modification);
      if (!transformed) {
        throw new Error('Rezept-Anpassung fehlgeschlagen.');
      }

      if (action === 'updateInPlan') {
        const activeId = this.activePlanId();
        if (!activeId) {
          throw new Error('Kein aktiver Plan vorhanden.');
        }
        // Persist update via PlanApiService
        const updatedPlan = await this.planApi.updateRecipeInPlan(
          activeId,
          originalRecipeId ?? recipe.id,
          transformed,
        );
        if (updatedPlan) {
          // replace plan in store
          const next = this.plans().map((p) =>
            p.id === updatedPlan.id ? updatedPlan : p,
          );
          this.plans.set(next);
        } else {
          throw new Error('Der aktualisierte Plan wurde nicht gespeichert.');
        }
      }

      return transformed;
    } catch (e: any) {
      this.error.set(e?.message ?? 'Rezept-Anpassung fehlgeschlagen.');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async saveTransformedRecipe(
    originalRecipeId: string,
    transformedRecipe: Recipe,
    action: 'updateInPlan' | 'saveAsCopy',
    planId?: string, // optional override
  ): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const activeId = planId ?? this.activePlanId(); // use override if provided

      const currentFavorites = new Set(this.favoriteRecipeIds());
      if (action === 'updateInPlan') {
        if (!activeId) {
          throw new Error('Kein aktiver Plan vorhanden.');
        }
        const updatedPlan = await this.planApi.updateRecipeInPlan(
          activeId,
          originalRecipeId,
          transformedRecipe,
        );
        if (!updatedPlan) {
          throw new Error(
            'Der aktualisierte Plan wurde nicht gespeichert. Bitte versuche es erneut.',
          );
        }

        // update both lists so UI stays consistent
        this.updatePlanInStores(updatedPlan);

        // ensure activePlanId points to the updated plan
        if (this.activePlanId() !== updatedPlan.id) {
          this.activePlanId.set(updatedPlan.id);
        }
      } else if (action === 'saveAsCopy') {
        await this.cookbookApi?.addRecipeToCookbook(transformedRecipe);
        const updatedFavorites = new Set(currentFavorites);
        updatedFavorites.add(transformedRecipe.id);
        this.favoriteRecipeIds.set(updatedFavorites);
      }
    } catch (e: any) {
      this.error.set(
        e?.message ?? 'Speichern des angepassten Rezepts fehlgeschlagen.',
      );
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async handleSwapMeal(
    dayName: string,
    mealKey: string,
    recipe: Recipe,
  ): Promise<void> {
    const user = this.auth.currentUser;
    const active = this.activePlan();
    if (!user || !active) {
      this.error.set('Plan konnte nicht gefunden werden.');
      return;
    }
    this.swappingMealId.set(recipe.id);
    this.error.set(null);

    try {
      const day = active.days.find((d) => d.day === dayName);
      if (!day) throw new Error('Tag nicht im Plan gefunden.');

      const otherMealNames = MEAL_FIELDS.map((key) => day[key])
        .filter((meal): meal is Recipe => !!meal)
        .map((meal) => meal.name);

      const recipeHadNutrition = !!recipe.nutrition;
      const newRecipe = await this.apiService.apiGenerateSingleMeal<
        PlannerOptions,
        Recipe
      >({
        planOptions: active.options ?? {
          people: 2,
          planDays: 7,
          cookTime: '30 Minuten',
          meals: {
            breakfast: true,
            lunch: true,
            dinner: true,
            snack: false,
            dessert: false,
          },
          enableNutritionAnalysis: false,
          planFocus: 'ausgewogen',
          gourmetMode: false,
        },
        mealType: mealKey,
        otherMealNames,
        recipeHadNutrition,
      });

      if (!newRecipe)
        throw new Error('Neues Rezept konnte nicht generiert werden.');

      const updatedPlan = await this.planApi.swapMealInPlan(
        active.id,
        dayName,
        mealKey,
        newRecipe,
      );
      if (updatedPlan) {
        // Update both primary plans and history to keep views in sync
        this.updatePlanInStores(updatedPlan);
      } else {
        throw new Error(
          'Der Plan konnte nach dem Tausch nicht aktualisiert werden.',
        );
      }
    } catch (error) {
      this.error.set(
        'Der Austausch des Rezepts ist fehlgeschlagen. Bitte versuche es später erneut.',
      );
    } finally {
      this.swappingMealId.set(null);
    }
  }
}
