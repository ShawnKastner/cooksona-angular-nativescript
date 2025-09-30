import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService, CookbookApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';
import { Recipe, CookbookCollection } from '@cooksona/models';

@Injectable({ providedIn: 'root' })
export class CookbookStore {
  private readonly cookbookApi = inject(CookbookApiService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly recipes = signal<Recipe[]>([]);
  readonly collections = signal<CookbookCollection[]>([]);
  readonly favoriteRecipeIds = signal<Set<string>>(new Set());
  readonly activeRecipeId = signal<string | null>(null);

  readonly activeRecipe = computed(() => {
    const id = this.activeRecipeId();
    if (!id) return null;
    return this.recipes().find((r) => String(r.id) === String(id)) ?? null;
  });

  setActiveRecipe(id: string | null) {
    this.activeRecipeId.set(id);
  }

  async load(collectionId?: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.cookbookApi.getCookbookForUser(collectionId);
      this.recipes.set(data ?? []);
      // ensure favorites set is populated
      const ids = new Set((await this.cookbookApi.getCookbookRecipeIds()) ?? []);
      this.favoriteRecipeIds.set(ids);
      // load collections too
      const cols = await this.cookbookApi.getRecipeCollections();
      this.collections.set(cols ?? []);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Fehler beim Laden des Kochbuchs');
    } finally {
      this.loading.set(false);
    }
  }

  async addRecipe(recipe: Recipe): Promise<Recipe | undefined> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const saved = await this.cookbookApi.addRecipeToCookbook(recipe);
      if (saved) {
        this.recipes.set([...(this.recipes() ?? []), saved]);
        const next = new Set(this.favoriteRecipeIds());
        next.add(String(saved.id));
        this.favoriteRecipeIds.set(next);
      }
      return saved;
    } catch (e: any) {
      this.error.set(e?.message ?? 'Fehler beim Hinzufügen des Rezepts');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async removeRecipe(recipeId: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.cookbookApi.removeRecipeFromCookbook(recipeId);
      const next = this.recipes().filter((r) => String(r.id) !== String(recipeId));
      this.recipes.set(next);
      const fav = new Set(this.favoriteRecipeIds());
      fav.delete(String(recipeId));
      this.favoriteRecipeIds.set(fav);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Fehler beim Entfernen des Rezepts');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async toggleFavorite(recipeId: string): Promise<void> {
    const current = new Set(this.favoriteRecipeIds());
    const isFav = current.has(String(recipeId));
    // Optimistic update
    if (isFav) current.delete(String(recipeId));
    else current.add(String(recipeId));
    this.favoriteRecipeIds.set(current);

    try {
      if (!isFav) {
        await this.cookbookApi.addRecipeToCookbook(
          this.recipes().find((r) => String(r.id) === String(recipeId))!,
        );
      } else {
        await this.cookbookApi.removeRecipeFromCookbook(recipeId);
      }
    } catch (e: any) {
      // revert on error
      const revert = new Set(this.favoriteRecipeIds());
      if (isFav) revert.add(String(recipeId));
      else revert.delete(String(recipeId));
      this.favoriteRecipeIds.set(revert);
      this.error.set(e?.message ?? 'Favoriten konnten nicht aktualisiert werden');
      throw e;
    }
  }

  async setCollectionsForRecipe(recipeId: string, collectionIds: string[]) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const updated = await this.cookbookApi.setRecipeToCollections(
        recipeId,
        collectionIds,
      );
      // update recipe in list
      const next = this.recipes().map((r) =>
        String(r.id) === String(updated.id) ? updated : r,
      );
      this.recipes.set(next);
      return updated;
    } catch (e: any) {
      this.error.set(e?.message ?? 'Sammlungen konnten nicht gesetzt werden');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }

  async suggestCollections(recipe: Recipe): Promise<string[] | undefined> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const suggestions = await this.cookbookApi.suggestRecipeCollections(recipe);
      return suggestions;
    } catch (e: any) {
      this.error.set(e?.message ?? 'Vorschläge konnten nicht geladen werden');
      return undefined;
    } finally {
      this.loading.set(false);
    }
  }

  async transformRecipe(recipe: Recipe, modification: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      // Gate behind pro/quota like planner if needed
      const isPro = !!this.auth?.isProUser?.();
      if (!isPro && this.auth?.getRemainingRequests && this.auth.getRemainingRequests() <= 0) {
        throw new Error('Nicht genügend Anfragen übrig. Bitte upgraden.');
      }

      const transformed = await this.api.apiTransformRecipe(recipe, modification);
      return transformed as Recipe;
    } catch (e: any) {
      this.error.set(e?.message ?? 'Rezept-Transformation fehlgeschlagen');
      throw e;
    } finally {
      this.loading.set(false);
    }
  }
}
