import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  HostListener,
  ChangeDetectionStrategy,
} from '@angular/core';
import { Recipe } from '@cooksona/models/recipe.models';
import { SvgInjectDirective } from '../../directives/svg-inject.directive';
import { ApiService } from '@cooksona/api';
import { FocusTrapDirective } from '../focus-trap.directive';
import {
  X,
  Wand2,
  Sparkles,
  Check,
  BookHeart,
  BarChart2,
  Users,
} from 'libs/constants/icons';

export type TransformAction = 'updateInPlan' | 'saveAsCopy';

@Component({
  selector: 'app-recipe-transform-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective, FocusTrapDirective],
  template: `
    @if (open && recipe) {
    <div
      class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 transition-opacity"
      (click)="close.emit()"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'transform-title'"
    >
      <div
        class="bg-base-100 rounded-2xl shadow-soft-xl w-full max-w-4xl transform transition-all max-h-[90vh] flex flex-col border border-base-200"
        (click)="$event.stopPropagation()"
        appFocusTrap
      >
        <header
          class="p-6 border-b border-base-200 flex items-start justify-between"
        >
          <div>
            <h2
              class="text-3xl font-serif font-bold text-neutral flex items-center gap-3"
              id="transform-title"
            >
              <span
                class="w-7 h-7 text-secondary"
                [svgInject]="icons.Wand2"
              ></span>
              Rezept-Anpassung
            </h2>
            <p class="text-gray-500 text-sm mt-1">
              Modifiziere "{{ recipe!.name }}" nach deinen Wünschen.
            </p>
          </div>
          <button
            type="button"
            (click)="close.emit()"
            class="p-2 rounded-full text-gray-400 hover:bg-base-200 hover:text-neutral transition-colors"
            aria-label="Schließen"
          >
            <span class="w-6 h-6" [svgInject]="icons.X"></span>
          </button>
        </header>

        <div
          class="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 overflow-y-auto"
        >
          <!-- Left Column: Original Recipe & Input -->
          <div class="space-y-6">
            <div>
              <h3 class="text-xl font-serif font-bold text-primary mb-2">
                Originalrezept
              </h3>
              @if (recipe!.servings) {
              <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
                <span class="w-4 h-4" [svgInject]="icons.Users"></span>
                <span>
                  Für {{ recipe!.servings }}
                  {{ recipe!.servings! > 1 ? 'Personen' : 'Person' }}
                </span>
              </div>
              }
              <div class="space-y-4 text-sm">
                <div>
                  <h4 class="font-semibold text-neutral">Zutaten</h4>
                  <ul
                    class="list-disc list-inside text-gray-600 mt-1 space-y-1"
                  >
                    @for (item of recipe!.ingredients; track item) {
                    <li>
                      <span class="font-medium text-neutral">{{
                        (item.amount + ' ' + item.unit).trim()
                      }}</span>
                      {{ ' ' + item.name }}
                    </li>
                    }
                  </ul>
                </div>
                @if (recipe!.instructions?.length) {
                <div>
                  <h4 class="font-semibold text-neutral mt-4">Anleitung</h4>
                  <ol
                    class="list-decimal list-outside ml-4 text-gray-600 mt-1 space-y-2"
                  >
                    @for (step of recipe!.instructions!; track step) {
                    <li class="pl-1">{{ step }}</li>
                    }
                  </ol>
                </div>
                } @if (recipe!.nutrition) {
                <div class="mt-4 pt-4 border-t border-base-200/80">
                  <h5
                    class="text-sm font-semibold text-neutral mb-2 flex items-center gap-2"
                  >
                    <span
                      class="w-4 h-4 text-gray-400"
                      [svgInject]="icons.BarChart2"
                    ></span>
                    Nährwert-Info (ca. pro Portion)
                  </h5>
                  <div
                    class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs"
                  >
                    <div>
                      <span class="font-bold text-lg block text-neutral">{{
                        recipe!.nutrition!.calories
                      }}</span>
                      <span class="text-gray-500">kcal</span>
                    </div>
                    <div>
                      <span class="font-bold text-lg block text-neutral">{{
                        recipe!.nutrition!.protein
                      }}</span>
                      <span class="text-gray-500">Protein</span>
                    </div>
                    <div>
                      <span class="font-bold text-lg block text-neutral">{{
                        recipe!.nutrition!.carbs
                      }}</span>
                      <span class="text-gray-500">Kohlenh.</span>
                    </div>
                    <div>
                      <span class="font-bold text-lg block text-neutral">{{
                        recipe!.nutrition!.fat
                      }}</span>
                      <span class="text-gray-500">Fett</span>
                    </div>
                  </div>
                </div>
                }
              </div>
            </div>
            <div class="pt-6 border-t border-base-200">
              <label
                for="modification"
                class="block text-md font-serif font-bold text-neutral mb-2"
                >Dein Wunsch:</label
              >
              <textarea
                id="modification"
                [(ngModel)]="modification"
                placeholder="z.B. 'Mach es vegetarisch' oder 'Passe die Mengen für 4 Personen an'"
                class="w-full h-24 p-3 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                [disabled]="isLoading || !!successAction"
              ></textarea>
              @if (error) {
              <p class="text-sm text-error mt-2">{{ error }}</p>
              }
              <button
                type="button"
                (click)="handleTransform()"
                [disabled]="
                  isLoading || !modification.trim() || !!successAction
                "
                class="w-full mt-3 flex items-center justify-center gap-2 bg-primary text-white font-bold py-2.5 px-4 rounded-xl hover:bg-primary-focus focus:outline-none focus:ring-4 focus:ring-primary/40 transition-all duration-300 disabled:bg-base-300"
              >
                <span class="w-5 h-5" [svgInject]="icons.Sparkles"></span>
                Transformieren
              </button>
            </div>
          </div>

          <!-- Right Column: Transformed Recipe -->
          <div
            class="bg-white rounded-xl border border-base-200 p-6 min-h-[300px]"
          >
            @if (isLoading) {
            <div class="flex flex-col items-center justify-center h-full">
              <div
                class="w-16 h-16 border-4 border-secondary border-t-transparent rounded-full animate-spin"
              ></div>
              <p class="mt-4 text-lg font-serif text-neutral">KI zaubert...</p>
            </div>
            } @else if (transformedRecipe) {
            <div class="space-y-6">
              <div>
                <h3 class="text-xl font-serif font-bold text-primary mb-2">
                  Angepasstes Rezept
                </h3>
                @if (transformedRecipe!.servings) {
                <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <span class="w-4 h-4" [svgInject]="icons.Users"></span>
                  <span>
                    Für {{ transformedRecipe!.servings }}
                    {{
                      transformedRecipe!.servings! > 1 ? 'Personen' : 'Person'
                    }}
                  </span>
                </div>
                }
                <div class="space-y-4 text-sm">
                  <div>
                    <h4 class="font-semibold text-neutral">Zutaten</h4>
                    <ul
                      class="list-disc list-inside text-gray-600 mt-1 space-y-1"
                    >
                      @for (item of transformedRecipe!.ingredients; track item)
                      {
                      <li>
                        <span class="font-medium text-neutral">{{
                          (item.amount + ' ' + item.unit).trim()
                        }}</span>
                        {{ ' ' + item.name }}
                      </li>
                      }
                    </ul>
                  </div>
                  @if (transformedRecipe!.instructions?.length) {
                  <div>
                    <h4 class="font-semibold text-neutral mt-4">Anleitung</h4>
                    <ol
                      class="list-decimal list-outside ml-4 text-gray-600 mt-1 space-y-2"
                    >
                      @for (step of transformedRecipe!.instructions!; track
                      step) {
                      <li class="pl-1">{{ step }}</li>
                      }
                    </ol>
                  </div>
                  } @if (transformedRecipe!.nutrition) {
                  <div class="mt-4 pt-4 border-t border-base-200/80">
                    <h5
                      class="text-sm font-semibold text-neutral mb-2 flex items-center gap-2"
                    >
                      <span
                        class="w-4 h-4 text-gray-400"
                        [svgInject]="icons.BarChart2"
                      ></span>
                      Nährwert-Info (ca. pro Portion)
                    </h5>
                    <div
                      class="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2 text-xs"
                    >
                      <div>
                        <span class="font-bold text-lg block text-neutral">{{
                          transformedRecipe!.nutrition!.calories
                        }}</span>
                        <span class="text-gray-500">kcal</span>
                      </div>
                      <div>
                        <span class="font-bold text-lg block text-neutral">{{
                          transformedRecipe!.nutrition!.protein
                        }}</span>
                        <span class="text-gray-500">Protein</span>
                      </div>
                      <div>
                        <span class="font-bold text-lg block text-neutral">{{
                          transformedRecipe!.nutrition!.carbs
                        }}</span>
                        <span class="text-gray-500">Kohlenh.</span>
                      </div>
                      <div>
                        <span class="font-bold text-lg block text-neutral">{{
                          transformedRecipe!.nutrition!.fat
                        }}</span>
                        <span class="text-gray-500">Fett</span>
                      </div>
                    </div>
                  </div>
                  }
                </div>
              </div>

              @if (successAction) {
              <div
                class="p-4 bg-green-100 text-success rounded-lg flex items-center justify-center gap-3 font-semibold"
              >
                <span class="w-6 h-6" [svgInject]="icons.Check"></span>
                {{ successAction }}
              </div>
              } @else {
              <div
                class="pt-6 border-t border-base-200 flex flex-col sm:flex-row gap-3"
              >
                <button
                  type="button"
                  (click)="handleAction('updateInPlan')"
                  class="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary font-bold py-2.5 px-4 rounded-xl hover:bg-primary/20 transition-colors"
                >
                  <span class="w-5 h-5" [svgInject]="icons.Check"></span>
                  Änderungen übernehmen
                </button>
                <button
                  type="button"
                  (click)="handleAction('saveAsCopy')"
                  class="flex-1 flex items-center justify-center gap-2 bg-secondary/20 text-secondary-focus font-bold py-2.5 px-4 rounded-xl hover:bg-secondary/30 transition-colors"
                >
                  <span class="w-5 h-5" [svgInject]="icons.BookHeart"></span>
                  Als Kopie speichern
                </button>
              </div>
              }
            </div>
            } @else if (!error) {
            <div
              class="flex flex-col items-center justify-center h-full text-center text-gray-400"
            >
              <p>Das angepasste Rezept erscheint hier.</p>
            </div>
            }
          </div>
        </div>
      </div>
    </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeTransformModalComponent implements OnChanges {
  @Input() open = false;
  @Input() recipe: Recipe | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() transformComplete = new EventEmitter<{
    originalRecipeId: string;
    transformedRecipe: Recipe;
    action: TransformAction;
  }>();

  readonly api = inject(ApiService);

  readonly icons = {
    X,
    Wand2,
    Sparkles,
    Check,
    BookHeart,
    BarChart2,
    Users,
  } as const;

  modification = '';
  transformedRecipe: Recipe | null = null;
  isLoading = false;
  error: string | null = null;
  successAction: string | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] && this.open) || changes['recipe']) {
      // Reset state when opening with a new recipe
      this.modification = '';
      this.transformedRecipe = null;
      this.isLoading = false;
      this.error = null;
      this.successAction = null;
    }
  }

  async handleTransform(): Promise<void> {
    const r = this.recipe;
    if (!r) return;
    if (!this.modification.trim()) {
      this.error = 'Bitte geben Sie einen Änderungswunsch ein.';
      return;
    }
    this.isLoading = true;
    this.error = null;
    this.transformedRecipe = null;
    try {
      const result = (await this.api.apiTransformRecipe<Recipe, Recipe>(
        r,
        this.modification
      )) as Recipe | undefined;
      if (!result) throw new Error('Ein Fehler ist aufgetreten.');
      this.transformedRecipe = result;
    } catch (err: any) {
      this.error = err?.message ?? 'Ein Fehler ist aufgetreten.';
    } finally {
      this.isLoading = false;
    }
  }

  handleAction(action: TransformAction): void {
    if (!this.recipe || !this.transformedRecipe) return;
    this.transformComplete.emit({
      originalRecipeId: this.recipe.id,
      transformedRecipe: this.transformedRecipe,
      action,
    });
    this.successAction =
      action === 'updateInPlan'
        ? 'Plan aktualisiert!'
        : 'Im Kochbuch gespeichert!';
    // Optional: self-close after brief success, parent may also close
    setTimeout(() => this.close.emit(), 2000);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) this.close.emit();
  }
}
