import { Component, inject, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { CookbookStore } from '../cookbook.store';
import { Recipe } from '@cooksona/models';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ns-recipes',
  templateUrl: './recipes.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class RecipesComponent {
  private readonly cookbookStore = inject(CookbookStore);

  recipesInCookbook = this.cookbookStore.recipes;
  loading = this.cookbookStore.loading;

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
}
