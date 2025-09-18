import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { BookHeart } from '@cooksona/constants/icons';
import { CookbookApiService } from '@cooksona/api';
import { Recipe } from '@cooksona/models/recipe.models';
import { CookbookCardComponent } from './cookbook-card.component';
import { RecipeTransformModalComponent } from '../../shared/ui/modals/recipe-transform-modal.component';
import { DeleteConfirmModalComponent } from '../../shared/ui/modals/delete-confirm-modal.component';
import { RecipeDetailModalComponent } from '../../shared/ui/modals/recipe-detail-modal.component';
import { toErrorMessage } from '../../shared/utils/error.utils';

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
  error = signal<string | null>(null);

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
    this.error.set(null);
    try {
      const recipes = await this.cookbookApi.getCookbookForUser();
      this.cookbook.set(recipes ?? []);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Deine Kochbuch-Einträge konnten nicht geladen werden. Bitte versuche es später erneut.'
        )
      );
    }
  }

  enrichRecipeWithFallback(recipe: Recipe): Recipe {
    if (recipe.servings && recipe.servings > 0) return recipe;
    return { ...recipe, servings: 2 };
  }

  handleShowRecipe(recipe: Recipe): void {
    this.error.set(null);
    this.selectedRecipe.set(this.enrichRecipeWithFallback(recipe));
  }

  handleCloseDetailModal(): void {
    this.selectedRecipe.set(null);
  }

  async handleToggleFavoriteInModal(recipe: Recipe): Promise<void> {
    const success = await this.removeRecipe(recipe.id);
    if (success) {
      this.handleCloseDetailModal();
    }
  }

  requestRemoveRecipe(recipe: Recipe): void {
    this.error.set(null);
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
    const success = await this.removeRecipe(r.id);
    if (success) {
      this.cancelRemove();
    }
  }

  handleOpenTransformModal(recipe: Recipe): void {
    this.error.set(null);
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
    this.error.set(null);
    let shouldCloseModal = true;
    try {
      const newRecipe = await this.cookbookApi.addRecipeToCookbook(
        ev.transformedRecipe
      );
      if (!newRecipe) {
        throw new Error(
          'Das transformierte Rezept konnte nicht gespeichert werden.'
        );
      }
      this.cookbook.set([newRecipe, ...this.cookbook()]);
    } catch (error) {
      shouldCloseModal = false;
      this.error.set(
        toErrorMessage(
          error,
          'Das Rezept konnte nicht gespeichert werden. Bitte versuche es später erneut.'
        )
      );
    } finally {
      if (shouldCloseModal) {
        this.handleCloseTransformModal();
      }
    }
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

  private async removeRecipe(recipeId: string): Promise<boolean> {
    this.error.set(null);
    try {
      await this.cookbookApi.removeRecipeFromCookbook(recipeId);
      this.cookbook.set(
        this.cookbook().filter((recipe) => recipe.id !== recipeId)
      );
      return true;
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Das Rezept konnte nicht entfernt werden. Bitte versuche es später erneut.'
        )
      );
      return false;
    }
  }
}
