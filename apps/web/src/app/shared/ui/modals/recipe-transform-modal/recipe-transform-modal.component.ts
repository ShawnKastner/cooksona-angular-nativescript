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
import { ApiService } from '@cooksona/api';
import { toErrorMessage } from '../../../utils/error.utils';
import { FocusTrapDirective } from '../../focus-trap.directive';
import {
  X,
  Wand2,
  Sparkles,
  Check,
  BookHeart,
  BarChart2,
  Users,
} from '@cooksona/constants/icons';

export type TransformAction = 'updateInPlan' | 'saveAsCopy';

@Component({
  selector: 'app-recipe-transform-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective, FocusTrapDirective],
  templateUrl: './recipe-transform-modal.component.html',
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

  modification = signal<string>('');
  transformedRecipe = signal<Recipe | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  successAction = signal<string | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] && this.open) || changes['recipe']) {
      // Reset state when opening with a new recipe
      this.modification.set('');
      this.transformedRecipe.set(null);
      this.isLoading.set(false);
      this.error.set(null);
      this.successAction.set(null);
    }
  }

  async handleTransform(): Promise<void> {
    const r = this.recipe;
    if (!r) return;
    if (!this.modification().trim()) {
      this.error.set('Bitte geben Sie einen Änderungswunsch ein.');
      return;
    }
    this.isLoading.set(true);
    this.error.set(null);
    this.transformedRecipe.set(null);
    try {
      const result = await this.api.apiTransformRecipe<Recipe, Recipe>(
        r,
        this.modification(),
      );
      if (!result) throw new Error('Ein Fehler ist aufgetreten.');
      this.transformedRecipe.set(result);
    } catch (error: unknown) {
      this.error.set(
        toErrorMessage(
          error,
          'Das Rezept konnte nicht angepasst werden. Bitte versuche es später erneut.',
        ),
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  handleAction(action: TransformAction): void {
    const transformed = this.transformedRecipe();
    if (!this.recipe || !transformed) return;
    this.transformComplete.emit({
      originalRecipeId: this.recipe.id,
      transformedRecipe: transformed,
      action,
    });
    this.successAction.set(
      action === 'updateInPlan'
        ? 'Plan aktualisiert!'
        : 'Im Kochbuch gespeichert!',
    );
    // Optional: self-close after brief success, parent may also close
    setTimeout(() => this.close.emit(), 2000);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) this.close.emit();
  }
}
