import {
  Component,
  NO_ERRORS_SCHEMA,
  signal,
  inject,
  OnInit,
} from '@angular/core';
import {
  ModalDialogParams,
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import { Recipe, CookbookCollection } from '@cooksona/models';
import { CookbookApiService } from '@cooksona/api';
import { X, Sparkles, Check, Plus } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

export interface AssignCollectionContext {
  recipe: Recipe;
  collections: CookbookCollection[];
}

@Component({
  selector: 'ns-assign-collection-modal',
  templateUrl: './assign-collection-modal.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    SvgToDataUriPipe,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AssignCollectionModalComponent implements OnInit {
  private readonly cookbookApi = inject(CookbookApiService);

  recipe!: Recipe;
  cookbookCollections = signal<CookbookCollection[]>([]);
  selectedIds = signal<Set<string>>(new Set<string>());
  newCollectionName = signal<string>('');
  aiSuggestions = signal<string[]>([]);
  isAiLoading = signal<boolean>(false);
  error = signal<string>('');

  icons = { X, Sparkles, Check, Plus } as const;

  constructor(private params: ModalDialogParams) {
    const context = this.params.context as AssignCollectionContext;
    this.recipe = context.recipe;
    this.cookbookCollections.set(context.collections);
  }

  async ngOnInit() {
    // Load current collections for this recipe
    try {
      const cols = await this.cookbookApi.getCollectionsForRecipe(
        this.recipe.id,
      );
      this.selectedIds.set(new Set(cols.map((c) => c.id)));
    } catch (error) {
      console.error('Failed to load collections for recipe', error);
    }

    // Load AI suggestions
    this.loadAiSuggestions();
  }

  async loadAiSuggestions() {
    this.isAiLoading.set(true);
    try {
      const suggestions = await this.cookbookApi.suggestRecipeCollections(
        this.recipe,
      );
      this.aiSuggestions.set(suggestions?.slice(0, 5) ?? []);
    } catch (error) {
      console.error('Failed to load AI suggestions', error);
    } finally {
      this.isAiLoading.set(false);
    }
  }

  close() {
    this.params.closeCallback(false);
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

  async saveSelections() {
    const finalSelectedIds: string[] = [];
    const newCollections: { name: string }[] = [];

    this.selectedIds().forEach((idOrName) => {
      if (idOrName.startsWith('new_')) {
        const name = idOrName.replace('new_', '');
        newCollections.push({ name });
      } else {
        finalSelectedIds.push(idOrName);
      }
    });

    try {
      // Create new collections first
      for (const newCol of newCollections) {
        const created = await this.cookbookApi.createRecipeCollection(
          newCol.name,
        );
        finalSelectedIds.push(created.id);
      }

      // Assign recipe to collections
      await this.cookbookApi.setRecipeToCollections(
        String(this.recipe.id),
        finalSelectedIds,
      );

      this.params.closeCallback(true);
    } catch (error: any) {
      this.error.set(error?.message ?? 'Fehler beim Speichern');
      console.error('Failed to save collections', error);
    }
  }

  getCollectionsHeight(): number {
    const count = this.cookbookCollections().length;
    const itemHeight = 50; // Approximate height of each collection item (padding + content)
    const calculatedHeight = count * itemHeight;
    const maxHeight = 120; // Maximum height

    // Return the smaller of calculated height or max height
    return Math.min(calculatedHeight, maxHeight);
  }
}
