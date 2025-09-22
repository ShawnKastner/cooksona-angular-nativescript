import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
  ViewChild,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { BookHeart } from '@cooksona/constants/icons';
import { CookbookApiService } from '@cooksona/api';
import { CookbookCollection, Recipe } from '@cooksona/models/recipe.models';
import { CookbookCardComponent } from './cookbook-card/cookbook-card.component';
import { toErrorMessage } from '../../shared/utils/error.utils';
import { DeleteConfirmModalComponent } from '../../shared/ui/modals/delete-confirm-modal/delete-confirm-modal.component';
import { RecipeDetailModalComponent } from '../../shared/ui/modals/recipe-detail-modal/recipe-detail-modal.component';
import { RecipeTransformModalComponent } from '../../shared/ui/modals/recipe-transform-modal/recipe-transform-modal.component';
import { AddToCollectionModalComponent } from '../../shared/ui/modals/add-collection-modal/add-to-collection-modal.component';
import { CollectionSidebarComponent } from './collection-sidebar/collection-sidebar.component';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner/loading-spinner.component';

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
    AddToCollectionModalComponent,
    CollectionSidebarComponent,
    LoadingSpinnerComponent,
  ],
  templateUrl: './cookbook.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CookbookComponent implements OnInit {
  private readonly cookbookApi = inject(CookbookApiService);
  private readonly snackbar = inject(SnackbarService);
  @ViewChild(CollectionSidebarComponent) sidebar?: CollectionSidebarComponent;

  // State
  loadRecipes = signal(false);
  cookbook = signal<Recipe[]>([]);
  searchTerm = signal('');
  error = signal<string | null>(null);

  // Modals
  selectedRecipe = signal<Recipe | null>(null);
  isTransformModalOpen = signal(false);
  recipeToTransform = signal<Recipe | null>(null);
  deleteModalOpen = signal(false);
  recipePendingDelete = signal<Recipe | null>(null);
  recipeToCategorize = signal<Recipe | null>(null);

  recipeCollections = signal<Record<string, string[]>>({});
  selectedCollectionId = signal<string>('all');
  loadingCollections = signal(false);

  collections = signal<CookbookCollection[]>([]);

  readonly icons = { BookHeart } as const;

  constructor() {
    effect(() => {
      const id = this.selectedCollectionId();
      this.loadCookbook(id === 'all' ? undefined : id);
    });
  }

  async ngOnInit(): Promise<void> {
    this.getCollections();
  }

  private async loadCookbook(collectionId?: string): Promise<void> {
    this.error.set(null);
    this.loadRecipes.set(true);
    try {
      const recipes = await this.cookbookApi.getCookbookForUser(collectionId);
      this.cookbook.set(recipes ?? []);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Deine Kochbuch-Einträge konnten nicht geladen werden. Bitte versuche es später erneut.'
        )
      );
    } finally {
      this.loadRecipes.set(false);
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
    let shouldCloseModal = signal(true);
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
      shouldCloseModal.set(false);
      this.error.set(
        toErrorMessage(
          error,
          'Das Rezept konnte nicht gespeichert werden. Bitte versuche es später erneut.'
        )
      );
    } finally {
      if (shouldCloseModal()) {
        this.handleCloseTransformModal();
      }
    }
  }

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

  async getCollections(): Promise<CookbookCollection[]> {
    this.loadingCollections.set(true);
    try {
      const cols = await this.cookbookApi.getRecipeCollections();
      this.collections.set(cols);
      return this.collections();
    } catch (error) {
      const msg = toErrorMessage(
        error,
        'Deine Sammlungen konnten nicht geladen werden. Bitte versuche es später erneut.'
      );
      this.snackbar.error(msg);
    } finally {
      this.loadingCollections.set(false);
    }
    return this.collections();
  }

  requestAddToCollection(recipe: Recipe): void {
    this.recipeToCategorize.set(recipe);
  }

  closeAddToCollection(): void {
    this.recipeToCategorize.set(null);
  }

  handleSaveCollections(ev: {
    recipe: Recipe;
    selectedIds: string[];
    newCollections: Omit<CookbookCollection, 'id'>[];
  }): void {
    const { recipe, selectedIds, newCollections } = ev;
    (async () => {
      try {
        let finalCollections = [...this.collections()];

        for (const c of newCollections) {
          const created = await this.cookbookApi.createRecipeCollection(c.name);
          finalCollections.push(created);
        }
        this.collections.set(finalCollections);
        this.sidebar?.getCollections();

        const finalIds = selectedIds
          .map(
            (idOrName) =>
              finalCollections.find(
                (col) => col.id === idOrName || col.name === idOrName
              )?.id
          )
          .filter((v): v is string => Boolean(v));

        const updatedRecipe = await this.cookbookApi.setRecipeToCollections(
          recipe.id,
          finalIds
        );
        this.cookbook.set(
          this.cookbook().map((r) => (r.id === recipe.id ? updatedRecipe : r))
        );

        this.closeAddToCollection();
        this.snackbar.success('Sammlungen aktualisiert.');
      } catch (error) {
        const msg = toErrorMessage(
          error,
          'Die Sammlungen konnten nicht gespeichert werden. Bitte versuche es später erneut.'
        );
        this.error.set(msg);
        this.snackbar.error(msg);
      }
    })();
  }

  // Sidebar event handlers
  handleCollectionChange(id: string): void {
    this.selectedCollectionId.set(id);
  }

  handleCollectionUpdated(): void {
    // Refresh collections so any sidebar changes reflect in modal inputs immediately
    this.getCollections();
  }
}
