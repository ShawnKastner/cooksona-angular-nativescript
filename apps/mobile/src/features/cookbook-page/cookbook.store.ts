import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiService, CookbookApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';
import { Recipe, CookbookCollection } from '@cooksona/models';

@Injectable({ providedIn: 'root' })
export class CookbookStore {
  private readonly cookbookApi = inject(CookbookApiService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly pageSize = 20;
  private currentPage = 1;
  private activeRequestId = 0;

  readonly loadingRecipes = signal(false);
  readonly loadingCollections = signal(false);
  private readonly loadingMutations = signal(false);
  readonly loading = computed(
    () =>
      this.loadingRecipes() ||
      this.loadingCollections() ||
      this.loadingMutations(),
  );
  readonly error = signal<string | null>(null);

  readonly recipes = signal<Recipe[]>([]);
  readonly collections = signal<CookbookCollection[]>([]);
  readonly favoriteRecipeIds = signal<Set<string>>(new Set());
  readonly activeRecipeId = signal<string | null>(null);
  readonly activeCollectionId = signal<string | undefined>(undefined);
  readonly searchTerm = signal('');
  readonly hasMore = signal(true);
  readonly loadingMore = signal(false);

  readonly activeRecipe = computed(() => {
    const id = this.activeRecipeId();
    if (!id) return null;
    return this.recipes().find((r) => String(r.id) === String(id)) ?? null;
  });

  setActiveRecipe(id: string | null) {
    this.activeRecipeId.set(id);
  }

  async load(options?: {
    collectionId?: string | null;
    search?: string;
    reloadRecipes?: boolean;
    reloadCollections?: boolean;
  }): Promise<void> {
    this.error.set(null);

    const hasCollectionIdOption =
      options && Object.prototype.hasOwnProperty.call(options, 'collectionId');
    const hasSearchOption =
      options && Object.prototype.hasOwnProperty.call(options, 'search');

    if (hasCollectionIdOption) {
      const normalized =
        options?.collectionId && options.collectionId.length > 0
          ? options.collectionId
          : undefined;
      this.activeCollectionId.set(normalized);
    }

    if (hasSearchOption) {
      const normalized = options?.search?.trim() ?? '';
      this.searchTerm.set(normalized);
    }

    const shouldLoadRecipes = options?.reloadRecipes ?? true;
    const shouldLoadCollections =
      options?.reloadCollections ??
      (!hasCollectionIdOption && !hasSearchOption);

    const loaders: Promise<void>[] = [];

    if (shouldLoadRecipes) {
      loaders.push(this.fetchRecipes(true));
    }

    if (shouldLoadCollections) {
      this.loadingCollections.set(true);
      loaders.push(
        (async () => {
          try {
            const cols = await this.cookbookApi.getRecipeCollections();
            this.collections.set(cols ?? []);
          } catch (e: any) {
            this.error.set(e?.message ?? 'Fehler beim Laden der Sammlungen');
          } finally {
            this.loadingCollections.set(false);
          }
        })(),
      );
    }

    if (loaders.length > 0) {
      await Promise.all(loaders);
    }
  }

  async addRecipe(recipe: Recipe): Promise<Recipe | undefined> {
    this.loadingMutations.set(true);
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
      this.loadingMutations.set(false);
    }
  }

  async updateRecipe(recipe: Recipe): Promise<Recipe | undefined> {
    this.loadingMutations.set(true);
    this.error.set(null);
    try {
      const recipeId = String(recipe.id);

      const updated = await this.cookbookApi.updateRecipeInCookbook(
        recipeId,
        recipe,
      );
      if (updated) {
        // Update the recipe in the list
        const next = this.recipes().map((r) =>
          String(r.id) === String(updated.id) ? updated : r,
        );
        this.recipes.set(next);
      }

      return updated;
    } catch (e: any) {
      this.error.set(e?.message ?? 'Fehler beim Aktualisieren des Rezepts');
      throw e;
    } finally {
      this.loadingMutations.set(false);
    }
  }

  async removeRecipe(recipeId: string): Promise<void> {
    this.loadingMutations.set(true);
    this.error.set(null);
    try {
      await this.cookbookApi.removeRecipeFromCookbook(recipeId);
      const next = this.recipes().filter(
        (r) => String(r.id) !== String(recipeId),
      );
      this.recipes.set(next);
      const fav = new Set(this.favoriteRecipeIds());
      fav.delete(String(recipeId));
      this.favoriteRecipeIds.set(fav);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Fehler beim Entfernen des Rezepts');
      throw e;
    } finally {
      this.loadingMutations.set(false);
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
      this.error.set(
        e?.message ?? 'Favoriten konnten nicht aktualisiert werden',
      );
      throw e;
    }
  }

  async setCollectionsForRecipe(recipeId: string, collectionIds: string[]) {
    this.loadingMutations.set(true);
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
      this.loadingMutations.set(false);
    }
  }

  async suggestCollections(recipe: Recipe): Promise<string[] | undefined> {
    this.loadingMutations.set(true);
    this.error.set(null);
    try {
      const suggestions =
        await this.cookbookApi.suggestRecipeCollections(recipe);
      return suggestions;
    } catch (e: any) {
      this.error.set(e?.message ?? 'Vorschläge konnten nicht geladen werden');
      return undefined;
    } finally {
      this.loadingMutations.set(false);
    }
  }

  async transformRecipe(recipe: Recipe, modification: string) {
    this.loadingMutations.set(true);
    this.error.set(null);
    try {
      // Gate behind pro/quota like planner if needed
      const isPro = !!this.auth?.isProUser?.();
      if (
        !isPro &&
        this.auth?.getRemainingRequests &&
        this.auth.getRemainingRequests() <= 0
      ) {
        throw new Error('Nicht genügend Anfragen übrig. Bitte upgraden.');
      }

      const transformed = await this.api.apiTransformRecipe(
        recipe,
        modification,
      );
      return transformed as Recipe;
    } catch (e: any) {
      this.error.set(e?.message ?? 'Rezept-Transformation fehlgeschlagen');
      throw e;
    } finally {
      this.loadingMutations.set(false);
    }
  }

  async loadNextPage(): Promise<void> {
    if (!this.hasMore()) return;
    if (this.loadingRecipes() || this.loadingMore()) return;
    await this.fetchRecipes(false);
  }

  private async fetchRecipes(reset: boolean): Promise<void> {
    const requestId = ++this.activeRequestId;

    if (reset) {
      this.loadingRecipes.set(true);
      this.currentPage = 1;
      this.hasMore.set(true);
      this.loadingMore.set(false);
    } else {
      if (!this.hasMore()) return;
      this.loadingMore.set(true);
    }

    const page = this.currentPage;
    try {
      const recipes =
        (await this.cookbookApi.getCookbookForUser(
          this.activeCollectionId(),
          this.searchTerm(),
          { page, limit: this.pageSize },
        )) ?? [];

      if (requestId !== this.activeRequestId) {
        return;
      }

      if (reset) {
        this.recipes.set(recipes);
      } else {
        this.recipes.set([...this.recipes(), ...recipes]);
      }

      if (recipes.length < this.pageSize) {
        this.hasMore.set(false);
      } else {
        this.currentPage = page + 1;
      }

      if (reset) {
        const ids = new Set(
          (await this.cookbookApi.getCookbookRecipeIds()) ?? [],
        );
        this.favoriteRecipeIds.set(ids);
      } else if (recipes.length) {
        const next = new Set(this.favoriteRecipeIds());
        for (const recipe of recipes) {
          if (recipe?.id != null) {
            next.add(String(recipe.id));
          }
        }
        this.favoriteRecipeIds.set(next);
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Fehler beim Laden des Kochbuchs');
    } finally {
      if (reset) {
        this.loadingRecipes.set(false);
      } else {
        this.loadingMore.set(false);
      }
    }
  }
}
