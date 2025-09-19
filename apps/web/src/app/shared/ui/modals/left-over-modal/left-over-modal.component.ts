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
  signal,
} from '@angular/core';
import { Recipe } from '@cooksona/models/recipe.models';
import { SvgInjectDirective } from '../../../directives/svg-inject.directive';
import {
  X,
  Sparkles,
  Check,
  BookHeart,
  Recycle,
  BarChart2,
  Users,
} from '@cooksona/constants/icons';
import { ApiService } from '@cooksona/api';
import { FocusTrapDirective } from '../../focus-trap.directive';
import { AuthService } from '@cooksona/auth';
import { toErrorMessage } from '../../../utils/error.utils';

@Component({
  selector: 'app-left-over-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective, FocusTrapDirective],
  templateUrl: './left-over-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeftOverModalComponent implements OnChanges {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() saveRecipe = new EventEmitter<Recipe | null>();

  readonly api = inject(ApiService);
  readonly auth = inject(AuthService);

  readonly FREE_USER_REQUEST_LIMIT = signal(5);

  readonly icons = {
    X,
    Sparkles,
    Check,
    BookHeart,
    Recycle,
    BarChart2,
    Users,
  } as const;

  ingredients = signal<string>('');
  generatedRecipe = signal<Recipe | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  private abortController = signal<AbortController | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']) {
      if (this.open) {
        this.resetState();
      } else {
        // Close: abort any inflight request
        this.abortController()?.abort();
        this.abortController.set(null);
      }
    }
  }

  private resetState(): void {
    this.ingredients.set('');
    this.generatedRecipe.set(null);
    this.error.set(null);
    this.success.set(null);
    this.isLoading.set(false);
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
      return this.auth.getRemainingRequests(this.FREE_USER_REQUEST_LIMIT());
    } catch {
      return this.FREE_USER_REQUEST_LIMIT();
    }
  }

  async handleGenerate(): Promise<void> {
    if (!this.ingredients().trim()) {
      this.error.set('Bitte geben Sie Zutaten ein.');
      return;
    }

    if (!this.isProUser && this.getRemainingRequests() <= 0) {
      this.error.set(
        `Dein Limit von ${this.FREE_USER_REQUEST_LIMIT()} Anfragen pro Monat ist erreicht. Bitte upgrade auf Pro für unbegrenzte Vorschläge.`
      );
      return;
    }

    this.error.set(null);
    this.generatedRecipe.set(null);
    this.success.set(null);

    // abort previous, start new
    this.abortController()?.abort();
    this.abortController.set(new AbortController());

    this.isLoading.set(true);
    try {
      const result = await this.api.apiGenerateLeftoverRecipe<Recipe>(
        this.ingredients(),
        this.abortController()?.signal
      );
      if (!result) throw new Error('Ein Fehler ist aufgetreten.');
      this.generatedRecipe.set(result);
      if (!this.isProUser) {
        try {
          await this.auth.consumeRequest();
        } catch (error) {
          this.success.set(null);
          this.error.set(
            toErrorMessage(
              error,
              'Deine Anfrage konnte nicht verbucht werden. Bitte lade die Seite neu.'
            )
          );
        }
      }
    } catch (error: unknown) {
      if (this.isAbortError(error)) return; // ignore abort
      this.error.set(
        toErrorMessage(
          error,
          'Die Resteverwertung ist fehlgeschlagen. Bitte versuche es später erneut.'
        )
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  handleSave(): void {
    if (!this.generatedRecipe()) return;
    this.saveRecipe.emit(this.generatedRecipe());
    this.success.set('Rezept im Kochbuch gespeichert!');
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) this.close.emit();
  }

  private isAbortError(error: unknown): boolean {
    if (typeof error !== 'object' || !error) return false;
    const maybeName = (error as { name?: unknown }).name;
    return typeof maybeName === 'string' && maybeName === 'AbortError';
  }
}
