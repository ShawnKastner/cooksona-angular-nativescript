import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService, PlanApiService } from '@cooksona/api';
import { MealPlan, ShoppingListItem, Ingredient } from '@cooksona/models';

export interface CategoryBlockUi {
  category: string;
  items: ShoppingListItem[];
}

@Injectable()
export class PlannerStore {
  private readonly planApi = inject(PlanApiService);
  private readonly apiService = inject(ApiService);

  // State
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly plans = signal<MealPlan[]>([]);
  readonly activePlanId = signal<string | null>(null);

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
}
