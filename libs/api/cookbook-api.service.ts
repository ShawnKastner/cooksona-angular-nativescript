import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { CookbookCollection, Recipe } from '@cooksona/models/recipe.models';

@Injectable({ providedIn: 'root' })
export class CookbookApiService {
  constructor(private readonly api: ApiService) {}

  async getCookbookForUser(
    collectionId?: string,
    searchTerm?: string,
  ): Promise<Recipe[]> {
    const params = new URLSearchParams();
    if (collectionId) {
      params.set('collectionId', collectionId);
    }
    if (searchTerm && searchTerm.trim().length > 0) {
      params.set('search', searchTerm.trim());
    }

    const url = params.toString()
      ? `/cookbook?${params.toString()}`
      : '/cookbook';
    const recipes = await this.api.get<Recipe[]>(url);
    return recipes ?? [];
  }

  async getCookbookRecipeIds(): Promise<Set<string>> {
    const recipes = await this.getCookbookForUser();
    return new Set(recipes.map((r) => String(r.id)));
  }

  addRecipeToCookbook(recipe: Recipe): Promise<Recipe | undefined> {
    const recipeToSend: Recipe = { ...recipe, id: String(recipe.id) };
    return this.api.post<Recipe>('/cookbook', recipeToSend);
  }

  updateRecipeInCookbook(
    recipeId: string,
    recipe: Recipe,
  ): Promise<Recipe | undefined> {
    const updateDto = {
      name: recipe.name,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      nutrition: recipe.nutrition,
      instructions: recipe.instructions,
    };
    return this.api.put<Recipe>(`/cookbook/${recipeId}`, updateDto);
  }

  removeRecipeFromCookbook(recipeId: string): Promise<void | undefined> {
    return this.api.delete<void>(`/cookbook/${recipeId}`);
  }

  async isRecipeInCookbook(recipeId: string): Promise<boolean> {
    try {
      const cookbook = await this.getCookbookForUser();
      return cookbook.some((r) => String(r.id) === String(recipeId));
    } catch (error) {
      // Log and return false like the React version
      console.error('Error checking cookbook status:', error);
      return false;
    }
  }

  // Collections for cookbook recipes
  async getRecipeCollections(): Promise<CookbookCollection[]> {
    try {
      const collections = await this.api.get<CookbookCollection[]>(
        '/cookbook/collections',
      );
      return collections ?? [];
    } catch (error) {
      console.error('Error fetching recipe collections:', error);
      return [];
    }
  }

  async createRecipeCollection(name: string): Promise<CookbookCollection> {
    const newCollection = await this.api.post<CookbookCollection>(
      '/cookbook/collections',
      { name },
    );
    if (!newCollection) {
      throw { message: 'Die Sammlung konnte nicht erstellt werden.' };
    }
    return newCollection;
  }

  async deleteRecipeCollection(collectionId: string): Promise<void> {
    return this.api.delete<void>(`/cookbook/collections/${collectionId}`);
  }

  async renameRecipeCollection(
    collectionId: string,
    newName: string,
  ): Promise<CookbookCollection> {
    const updatedCollection = await this.api.put<CookbookCollection>(
      `/cookbook/collections/${collectionId}`,
      { name: newName },
    );
    if (!updatedCollection) {
      throw { message: 'Die Sammlung konnte nicht umbenannt werden.' };
    }
    return updatedCollection;
  }

  async setRecipeToCollections(
    recipeId: string,
    collectionIds: string[],
  ): Promise<Recipe> {
    const updated = await this.api.put<Recipe>(
      `/cookbook/recipes/${recipeId}/collections`,
      { collectionIds },
    );
    if (!updated) {
      throw {
        message: 'Die Rezept-Sammlungen konnten nicht aktualisiert werden.',
      };
    }
    return updated;
  }

  async getCollectionsForRecipe(
    recipeId?: string,
  ): Promise<CookbookCollection[]> {
    const collections = await this.api.get<CookbookCollection[]>(
      `/cookbook/recipes/${recipeId}/collections`,
    );
    return collections ?? [];
  }

  async suggestRecipeCollections(
    recipe: Recipe,
  ): Promise<string[] | undefined> {
    const payload = {
      recipe: {
        name: recipe.name,
        ingredients: recipe.ingredients.map((ing) => ({ name: ing.name })),
      },
    };
    return this.api.post<string[]>('/ai/suggest-collections', payload);
  }
}
