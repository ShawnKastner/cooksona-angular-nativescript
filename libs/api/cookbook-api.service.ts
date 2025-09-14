import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Recipe } from '@cooksona/models/recipe.models';

@Injectable({ providedIn: 'root' })
export class CookbookApiService {
  constructor(private readonly api: ApiService) {}

  async getCookbookForUser(): Promise<Recipe[]> {
    const recipes = await this.api.get<Recipe[]>('/cookbook');
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

  removeRecipeFromCookbook(recipeId: string): Promise<void | undefined> {
    return this.api.delete<void>(`/cookbook/${encodeURIComponent(recipeId)}`);
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
}
