import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Recipe } from '@cooksona/models/recipe.models';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { BookText, Trash, Wand2, Users } from 'libs/constants/icons';
import { AuthService } from '@cooksona/auth';

@Component({
  selector: 'app-cookbook-card',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective],
  template: `
    <div
      class="bg-white rounded-2xl shadow-soft border border-base-200 flex flex-col overflow-hidden transition-all duration-300 hover:shadow-soft-lg hover:-translate-y-1"
    >
      <div class="p-6 flex-grow">
        <h3
          class="font-serif text-2xl font-bold text-primary mb-3 h-16 overflow-hidden"
          style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; min-height: 2.7em; max-height: 2.7em;"
        >
          {{ recipe.name }}
        </h3>
        @if (recipe.servings) {
        <div class="flex items-center gap-2 text-xs text-gray-500 mb-3 -mt-2">
          <span class="w-4 h-4" [svgInject]="icons.Users"></span>
          <span>
            Für {{ recipe.servings }}
            {{ recipe.servings! > 1 ? 'Personen' : 'Person' }}
          </span>
        </div>
        }
        <p class="text-sm text-gray-500 mb-2">Zutaten:</p>
        <ul
          class="text-sm text-gray-600 space-y-1 h-24 overflow-hidden mask-gradient"
        >
          @for (item of recipe.ingredients.slice(0, 5); track item) {
          <li class="truncate">
            <span class="font-medium text-neutral">{{
              (item.amount + ' ' + item.unit).trim()
            }}</span>
            {{ ' ' + item.name }}
          </li>
          } @if (recipe.ingredients.length > 5) {
          <li class="text-gray-400">... und mehr</li>
          }
        </ul>
      </div>
      <div
        class="p-4 bg-base-100/50 border-t border-base-200 flex justify-between items-center flex-wrap gap-2"
      >
        <button
          type="button"
          (click)="onShowDetails.emit()"
          class="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-focus transition-colors"
        >
          <span class="w-4 h-4" [svgInject]="icons.BookText"></span>
          Anleitung
        </button>
        <div class="flex items-center gap-1">
          @if (isPro) {
          <button
            type="button"
            (click)="onOpenTransformModal.emit()"
            class="p-2 rounded-full text-gray-400 hover:bg-secondary/20 hover:text-secondary-focus transition-colors"
            aria-label="Rezept anpassen"
          >
            <span class="w-5 h-5" [svgInject]="icons.Wand2"></span>
          </button>
          }
          <button
            type="button"
            (click)="onRemove.emit()"
            class="p-2 rounded-full text-gray-400 hover:bg-red-100 hover:text-error transition-colors"
            aria-label="Aus Kochbuch entfernen"
          >
            <span class="w-5 h-5" [svgInject]="icons.Trash"></span>
          </button>
        </div>
      </div>
    </div>
  `,
})
export class CookbookCardComponent {
  @Input({ required: true }) recipe!: Recipe;
  @Output() onShowDetails = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<void>();
  @Output() onOpenTransformModal = new EventEmitter<void>();

  private readonly auth = inject(AuthService);
  readonly icons = { BookText, Trash, Wand2, Users } as const;

  get isPro(): boolean {
    try {
      return this.auth.isProUser();
    } catch {
      return true;
    }
  }
}
