import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CookbookCollection, Recipe } from '@cooksona/models/recipe.models';
import { X, Sparkles, Check, Plus } from '@cooksona/constants/icons';
import { SvgInjectDirective } from '../../../directives/svg-inject.directive';
import { FocusTrapDirective } from '../../focus-trap.directive';
import { CookbookApiService } from '@cooksona/api';
import { SnackbarService } from '../../snackbar/snackbar.service';
import { toErrorMessage } from '../../../utils/error.utils';

@Component({
  selector: 'app-add-to-collection-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective, FocusTrapDirective],
  templateUrl: './add-to-collection-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToCollectionModalComponent implements OnChanges {
  @Input() open = false;
  @Input() recipe: Recipe | null = null;
  @Input() collections: CookbookCollection[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{
    recipe: Recipe;
    selectedIds: string[];
    newCollections: { name: string }[];
  }>();

  private readonly cookbookApi = inject(CookbookApiService);
  private readonly snackbar = inject(SnackbarService);

  readonly icons = { X, Sparkles, Check, Plus } as const;

  selectedIds = signal<Set<string>>(new Set<string>());
  newCollectionName = signal<string>('');
  aiSuggestions = signal<string[]>([]);
  isAiLoading = signal<boolean>(false);
  error = signal<string>('');
  kiSuggestError = signal<string>('');
  cookbookCollections = signal<CookbookCollection[]>([]);

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['open'] || changes['recipe']) && this.open && this.recipe) {
      this.cookbookCollections.set(this.collections);

      this.aiSuggestions.set([]);
      this.newCollectionName.set('');
      this.error.set('');

      // Authoritative fetch from backend for this recipe's collections
      this.cookbookApi
        .getCollectionsForRecipe(this.recipe.id)
        .then((cols) => this.selectedIds.set(new Set(cols.map((c) => c.id))))
        .catch(() => {
          this.snackbar.error('Die Sammlungen konnten nicht geladen werden.');
        });

      // Fetch AI suggestion list asynchronously and set when ready
      this.getStubbedSuggestions(this.recipe).then((suggestions) =>
        this.aiSuggestions.set(suggestions.slice(0, 5)),
      );
    }
  }

  isSelected(id: string): boolean {
    return this.selectedIds().has(id);
  }

  toggle(id: string): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectedIds.set(next);
  }

  addSuggestion(name: string): void {
    const existing = this.cookbookCollections().find(
      (c) => c.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) {
      this.toggle(existing.id);
    } else {
      this.newCollectionName.set(name);
      this.createAndSelect();
    }
  }

  createAndSelect(): void {
    const name = this.newCollectionName().trim();
    if (!name) return;
    if (
      this.cookbookCollections().some(
        (c) => c.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      this.error.set('Eine Sammlung mit diesem Namen existiert bereits.');
      return;
    }
    this.error.set('');
    const tempId = `new_${name}`;
    this.selectedIds.set(new Set(this.selectedIds()).add(tempId));

    this.cookbookCollections.set([
      { id: tempId, name },
      ...this.cookbookCollections(),
    ]);
    this.newCollectionName.set('');
  }

  saveSelections(): void {
    if (!this.recipe) return;
    const finalSelectedIds: string[] = [];
    const newCollections: { name: string }[] = [];
    this.selectedIds().forEach((idOrName) => {
      if (idOrName.startsWith('new_')) {
        const name = idOrName.replace('new_', '');
        newCollections.push({ name });
        finalSelectedIds.push(name);
      } else {
        finalSelectedIds.push(idOrName);
      }
    });
    this.save.emit({
      recipe: this.recipe,
      selectedIds: finalSelectedIds,
      newCollections,
    });
  }

  async getStubbedSuggestions(recipe: Recipe): Promise<string[]> {
    this.isAiLoading.set(true);
    try {
      const res = await this.cookbookApi.suggestRecipeCollections(recipe);
      return res ?? [];
    } catch (error) {
      this.kiSuggestError.set(
        'Die KI-Vorschläge konnten nicht geladen werden.',
      );
      return [];
    } finally {
      this.isAiLoading.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) {
      this.close.emit();
    }
  }
}
