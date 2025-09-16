import { Component, OnInit, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { BookHeart } from 'libs/constants/icons';
import { CookbookApiService } from '@cooksona/api';
import { Recipe } from '@cooksona/models/recipe.models';
import { CookbookCardComponent } from './cookbook-card.component';
import { RecipeDetailModalComponent } from '../../components/modals/recipe-detail-modal.component';
import { RecipeTransformModalComponent } from '../../components/modals/recipe-transform-modal.component';
import { DeleteConfirmModalComponent } from '../../components/modals/delete-confirm-modal.component';

@Component({
  selector: 'app-cookbook-page',
  standalone: true,
  imports: [
    CommonModule,
    SvgInjectDirective,
    CookbookCardComponent,
    RecipeDetailModalComponent,
    RecipeTransformModalComponent,
    DeleteConfirmModalComponent,
  ],
  templateUrl: './cookbook.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookbookComponent implements OnInit {
  private readonly cookbookApi = inject(CookbookApiService);

  // State
  cookbook = signal<Recipe[]>([]);
  searchTerm = signal('');

  // Modals
  selectedRecipe = signal<Recipe | null>(null);
  isTransformModalOpen = signal(false);
  recipeToTransform = signal<Recipe | null>(null);
  deleteModalOpen = signal(false);
  recipePendingDelete = signal<Recipe | null>(null);

  readonly icons = { BookHeart } as const;

  async ngOnInit(): Promise<void> {
    await this.loadCookbook();
  }

  private async loadCookbook(): Promise<void> {
    try {
      const recipes = await this.cookbookApi.getCookbookForUser();
      this.cookbook.set(recipes ?? []);
    } catch (e) {
      console.error('Failed to fetch cookbook', e);
      this.cookbook.set([]);
    }
  }

  enrichRecipeWithFallback(recipe: Recipe): Recipe {
    if (recipe.servings && recipe.servings > 0) return recipe;
    return { ...recipe, servings: 2 };
  }

  handleShowRecipe(recipe: Recipe): void {
    this.selectedRecipe.set(this.enrichRecipeWithFallback(recipe));
  }

  handleCloseDetailModal(): void {
    this.selectedRecipe.set(null);
  }

  async handleRemoveRecipe(recipeId: string): Promise<void> {
    try {
      await this.cookbookApi.removeRecipeFromCookbook(recipeId);
    } catch {}
    this.cookbook.set(this.cookbook().filter((r) => r.id !== recipeId));
  }

  requestRemoveRecipe(recipe: Recipe): void {
    this.recipePendingDelete.set(recipe);
    this.deleteModalOpen.set(true);
  }

  cancelRemove(): void {
    this.deleteModalOpen.set(false);
    setTimeout(() => this.recipePendingDelete.set(null), 200);
  }

  async confirmRemove(): Promise<void> {
    const r = this.recipePendingDelete();
    if (!r) return;
    await this.handleRemoveRecipe(r.id);
    this.cancelRemove();
  }

  handleToggleFavoriteInModal(recipe: Recipe): void {
    void this.handleRemoveRecipe(recipe.id);
    this.handleCloseDetailModal();
  }

  handleOpenTransformModal(recipe: Recipe): void {
    this.recipeToTransform.set(this.enrichRecipeWithFallback(recipe));
    this.isTransformModalOpen.set(true);
  }

  handleCloseTransformModal(): void {
    this.isTransformModalOpen.set(false);
    setTimeout(() => this.recipeToTransform.set(null), 300);
  }

  async handleTransformComplete(ev: {
    originalRecipeId: string;
    transformedRecipe: Recipe;
    action: 'updateInPlan' | 'saveAsCopy';
  }): Promise<void> {
    try {
      const newRecipe = await this.cookbookApi.addRecipeToCookbook(
        ev.transformedRecipe
      );
      if (newRecipe) this.cookbook.set([newRecipe, ...this.cookbook()]);
    } catch {}
    this.handleCloseTransformModal();
  }

  filteredCookbook = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.cookbook();
    if (!term) return list;
    return list.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(term) ||
        recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(term))
    );
  });
}
