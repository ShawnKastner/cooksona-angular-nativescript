import {
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  ViewContainerRef,
} from '@angular/core';
import {
  NativeScriptCommonModule,
  ModalDialogService,
} from '@nativescript/angular';
import { ScrollEventData, ScrollView } from '@nativescript/core';
import { CookbookStore } from '../cookbook.store';
import { Recipe } from '@cooksona/models';
import { ActivatedRoute, Router } from '@angular/router';
import { FolderPlus } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { AssignCollectionModalComponent } from '../assign-collection-modal/assign-collection-modal.component';

@Component({
  selector: 'ns-recipes',
  templateUrl: './recipes.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class RecipesComponent {
  private readonly cookbookStore = inject(CookbookStore);
  private readonly modalService = inject(ModalDialogService);
  private readonly vcRef = inject(ViewContainerRef);

  recipesInCookbook = this.cookbookStore.recipes;
  loading = this.cookbookStore.loadingRecipes;
  loadingMore = this.cookbookStore.loadingMore;
  hasMore = this.cookbookStore.hasMore;
  private readonly loadMoreThreshold = 120;

  icons = {
    FolderPlus,
  } as const;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  openRecipe(recipe: Recipe) {
    // mark recipe as active in store so other components can react
    if (recipe && recipe.id) {
      this.cookbookStore.setActiveRecipe(String(recipe.id));

      this.router.navigate(['/recipe', recipe.id], {
        state: { recipe: recipe, source: 'cookbook' },
      });
    }
  }

  async openAssignCollectionModal(recipe: Recipe) {
    try {
      const success = await this.modalService.showModal(
        AssignCollectionModalComponent,
        {
          viewContainerRef: this.vcRef,
          context: {
            recipe: recipe,
            collections: this.cookbookStore.collections(),
          },
          transition: {},
          fullscreen: true,
          animated: false,
        },
      );

      if (success) {
        // Reload cookbook to reflect changes
        await this.cookbookStore.load({ reloadCollections: true });
      }
    } catch (error) {
      console.error('Failed to open assign collection modal', error);
    }
  }

  handleScroll(event: ScrollEventData) {
    if (!this.hasMore()) return;
    if (this.loading() || this.loadingMore()) return;

    const scrollView = event.object as ScrollView | undefined;
    if (!scrollView) return;

    const offset = event.scrollY ?? 0;
    const maxOffset = scrollView.scrollableHeight ?? 0;
    if (maxOffset <= 0) return;

    if (offset >= maxOffset - this.loadMoreThreshold) {
      void this.cookbookStore.loadNextPage();
    }
  }
}
