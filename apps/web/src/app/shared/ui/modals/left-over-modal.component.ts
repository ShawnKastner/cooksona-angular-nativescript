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
} from '@angular/core';
import { Recipe } from '@cooksona/models/recipe.models';
import { SvgInjectDirective } from '../../directives/svg-inject.directive';
import {
  X,
  Sparkles,
  Check,
  BookHeart,
  Recycle,
  BarChart2,
  Users,
} from 'libs/constants/icons';
import { ApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';
import { ChangeDetectionStrategy } from '@angular/core';

const FREE_USER_REQUEST_LIMIT = 5;

@Component({
  selector: 'app-left-over-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective],
  template: `
    @if (open) {
    <div
      class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4 transition-opacity"
      (click)="close.emit()"
      role="dialog"
      aria-modal="true"
    >
      <div
        class="bg-base-100 rounded-2xl shadow-soft-xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col border border-base-200"
        (click)="$event.stopPropagation()"
      >
        <header
          class="p-6 border-b border-base-200 flex items-start justify-between"
        >
          <div>
            <h2
              class="text-3xl font-serif font-bold text-neutral flex items-center gap-3"
            >
              <span
                class="w-7 h-7 text-primary"
                [svgInject]="icons.Recycle"
              ></span>
              Resteverwerter
            </h2>
            <p class="text-gray-500 text-sm mt-1">
              Was ist noch im Kühlschrank?
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

        <div class="p-6 md:p-8 overflow-y-auto space-y-6">
          <div>
            <label
              for="ingredients"
              class="block text-md font-serif font-bold text-neutral mb-2"
            >
              Verfügbare Zutaten:
            </label>
            <textarea
              id="ingredients"
              [(ngModel)]="ingredients"
              placeholder="z.B. 'Hähnchenbrust, 1 Paprika, Reis, etwas Zwiebel'"
              class="w-full h-24 p-3 bg-white border-2 border-base-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
              [disabled]="isLoading || !!success"
            ></textarea>
            @if (error) {
            <p class="text-sm text-error mt-2">{{ error }}</p>
            }
            <button
              type="button"
              (click)="handleGenerate()"
              [disabled]="isLoading || !ingredients.trim() || !!success"
              class="w-full mt-3 flex items-center justify-center gap-2 bg-primary text-white font-bold py-2.5 px-4 rounded-xl hover:bg-primary-focus focus:outline-none focus:ring-4 focus:ring-primary/40 transition-all duration-300 disabled:bg-base-300"
            >
              <span class="w-5 h-5" [svgInject]="icons.Sparkles"></span>
              Rezept vorschlagen
            </button>
          </div>

          <div
            class="bg-white rounded-xl border border-base-200 p-6 min-h-[200px] flex items-center justify-center"
          >
            @if (isLoading) {
            <div class="flex flex-col items-center justify-center h-full">
              <div
                class="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"
              ></div>
              <p class="mt-4 text-lg font-serif text-neutral">
                Suche nach Ideen...
              </p>
            </div>
            } @else if (generatedRecipe) {
            <div class="w-full space-y-4">
              <div class="space-y-4 text-sm">
                <h3 class="text-xl font-serif font-bold text-primary mb-2">
                  {{ generatedRecipe!.name }}
                </h3>
                @if (generatedRecipe!.servings) {
                <div class="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <span class="w-4 h-4" [svgInject]="icons.Users"></span>
                  <span>
                    Für {{ generatedRecipe!.servings }}
                    {{ generatedRecipe!.servings! > 1 ? 'Personen' : 'Person' }}
                  </span>
                </div>
                }
                <div>
                  <h4 class="font-semibold text-neutral">Zutaten</h4>
                  <ul
                    class="list-disc list-inside text-gray-600 mt-1 space-y-1"
                  >
                    @for (item of generatedRecipe!.ingredients; track item) {
                    <li>
                      <span class="font-medium text-neutral">{{
                        (item.amount + ' ' + item.unit).trim()
                      }}</span>
                      {{ ' ' + item.name }}
                    </li>
                    }
                  </ul>
                </div>
                @if (generatedRecipe!.instructions?.length) {
                <div>
                  <h4 class="font-semibold text-neutral mt-4">Anleitung</h4>
                  <ol
                    class="list-decimal list-outside ml-4 text-gray-600 mt-1 space-y-2"
                  >
                    @for (step of generatedRecipe!.instructions!; track step) {
                    <li class="pl-1">{{ step }}</li>
                    }
                  </ol>
                </div>
                } @if (generatedRecipe!.nutrition) {
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
                      <span class="font-bold text-lg text-neutral">{{
                        generatedRecipe!.nutrition!.calories
                      }}</span>
                      <span class="text-gray-500"> kcal</span>
                    </div>
                    <div>
                      <span class="font-bold text-lg text-neutral">{{
                        generatedRecipe!.nutrition!.protein
                      }}</span>
                      <span class="text-gray-500"> Protein</span>
                    </div>
                    <div>
                      <span class="font-bold text-lg text-neutral">{{
                        generatedRecipe!.nutrition!.carbs
                      }}</span>
                      <span class="text-gray-500"> Kohlenh.</span>
                    </div>
                    <div>
                      <span class="font-bold text-lg text-neutral">{{
                        generatedRecipe!.nutrition!.fat
                      }}</span>
                      <span class="text-gray-500"> Fett</span>
                    </div>
                  </div>
                </div>
                }
              </div>
              @if (success) {
              <div
                class="p-3 bg-green-100 text-success rounded-lg flex items-center justify-center gap-3 font-semibold text-sm"
              >
                <span class="w-5 h-5" [svgInject]="icons.Check"></span>
                {{ success }}
              </div>
              } @else {
              <div class="pt-4 border-t border-base-200">
                <button
                  type="button"
                  (click)="handleSave()"
                  class="w-full flex items-center justify-center gap-2 bg-secondary/20 text-secondary-focus font-bold py-2.5 px-4 rounded-xl hover:bg-secondary/30 transition-colors"
                >
                  <span class="w-5 h-5" [svgInject]="icons.BookHeart"></span>
                  Im Kochbuch speichern
                </button>
              </div>
              }
            </div>
            } @else if (!error) {
            <div class="text-center text-gray-400">
              <p>Dein Rezeptvorschlag erscheint hier.</p>
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
export class LeftOverModalComponent implements OnChanges {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() saveRecipe = new EventEmitter<Recipe>();

  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly icons = {
    X,
    Sparkles,
    Check,
    BookHeart,
    Recycle,
    BarChart2,
    Users,
  } as const;

  ingredients = '';
  generatedRecipe: Recipe | null = null;
  isLoading = false;
  error: string | null = null;
  success: string | null = null;
  private abortController: AbortController | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.resetState();
      } else {
        // Close: abort any inflight request
        this.abortController?.abort();
        this.abortController = null;
      }
    }
  }

  private resetState(): void {
    this.ingredients = '';
    this.generatedRecipe = null;
    this.error = null;
    this.success = null;
    this.isLoading = false;
  }

  private get isProUser(): boolean {
    try {
      return this.auth.isProUser();
    } catch {
      return true;
    }
  }

  private getRemainingRequests(): number {
    try {
      return this.auth.getRemainingRequests(FREE_USER_REQUEST_LIMIT);
    } catch {
      return FREE_USER_REQUEST_LIMIT;
    }
  }

  async handleGenerate(): Promise<void> {
    if (!this.ingredients.trim()) {
      this.error = 'Bitte geben Sie Zutaten ein.';
      return;
    }

    if (!this.isProUser && this.getRemainingRequests() <= 0) {
      this.error = `Dein Limit von ${FREE_USER_REQUEST_LIMIT} Anfragen pro Monat ist erreicht. Bitte upgrade auf Pro für unbegrenzte Vorschläge.`;
      return;
    }

    this.error = null;
    this.generatedRecipe = null;
    this.success = null;

    // abort previous, start new
    this.abortController?.abort();
    this.abortController = new AbortController();

    this.isLoading = true;
    try {
      const result = (await this.api.apiGenerateLeftoverRecipe<Recipe>(
        this.ingredients,
        this.abortController.signal
      )) as Recipe | undefined;
      if (!result) throw new Error('Ein Fehler ist aufgetreten.');
      this.generatedRecipe = result;
      if (!this.isProUser) {
        try {
          await this.auth.consumeRequest();
        } catch {}
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return; // ignore abort
      this.error = err?.message ?? 'Ein Fehler ist aufgetreten.';
    } finally {
      this.isLoading = false;
    }
  }

  handleSave(): void {
    if (!this.generatedRecipe) return;
    this.saveRecipe.emit(this.generatedRecipe);
    this.success = 'Rezept im Kochbuch gespeichert!';
  }
}
