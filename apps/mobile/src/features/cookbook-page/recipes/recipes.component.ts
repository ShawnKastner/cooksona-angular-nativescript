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
  loading = this.cookbookStore.loading;

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

      this.router.navigate(['../recipe', recipe.id], {
        relativeTo: this.route,
        state: { recipe: recipe, source: 'cookbook' },
      });
    }
  }

  async openAssignCollectionModal(recipe: Recipe, event?: any) {
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
        await this.cookbookStore.load();
      }
    } catch (error) {
      console.error('Failed to open assign collection modal', error);
    }
  }
}
