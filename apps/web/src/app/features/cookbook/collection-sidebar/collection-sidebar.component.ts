import {
  Component,
  EventEmitter,
  inject,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookOpen, ListTree, Trash, Plus } from '@cooksona/constants/icons';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { CookbookApiService } from '@cooksona/api';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { toErrorMessage } from '../../../shared/utils/error.utils';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { LoadingSpinnerSmallComponent } from '../../../shared/ui/loading-spinner/loading-spinner-small.component';
import { DeleteConfirmModalComponent } from '../../../shared/ui/modals/delete-confirm-modal/delete-confirm-modal.component';
import { CookbookCollection } from '../../../../../../../libs/models/recipe.models';

@Component({
  selector: 'app-collection-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    SvgInjectDirective,
    LoadingSpinnerComponent,
    LoadingSpinnerSmallComponent,
    DeleteConfirmModalComponent,
  ],
  templateUrl: './collection-sidebar.component.html',
})
export class CollectionSidebarComponent implements OnInit {
  @Output() collectionSelected = new EventEmitter<string>();
  @Output() collectionUpdated = new EventEmitter<void>();
  cookBookApi = inject(CookbookApiService);
  private readonly snackbar = inject(SnackbarService);

  loadCollections = signal(false);
  createLoading = signal(false);
  deleteModalOpen = signal(false);
  deleteTargetMessage = signal<string | null>(null);
  deleteTargetId = signal<string | null>(null);
  error = signal<string | null>(null);

  readonly selectedCollectionId = signal<string>('all');
  readonly isCreating = signal(false);
  readonly newCollectionName = signal('');
  readonly collections = signal<CookbookCollection[]>([]);

  readonly icons = { BookOpen, ListTree, Trash, Plus } as const;

  ngOnInit(): void {
    this.getCollections();
  }

  getCollections(): CookbookCollection[] {
    this.loadCollections.set(true);
    this.cookBookApi
      .getRecipeCollections()
      .then((cols) => this.collections.set(cols))
      .catch((error) => {
        const msg = toErrorMessage(
          error,
          'Deine Sammlungen konnten nicht geladen werden. Bitte versuche es später erneut.',
        );
        this.snackbar.error(msg);
      })
      .finally(() => this.loadCollections.set(false));
    return this.collections();
  }

  select(id: string): void {
    this.selectedCollectionId.set(id);
    this.collectionSelected.emit(id);
  }

  async handleCreate(): Promise<void> {
    this.createLoading.set(true);
    this.isCreating.set(true);
    try {
      const name = this.newCollectionName().trim();
      if (!name) {
        this.snackbar.error('Der Name der Sammlung darf nicht leer sein.');
        return;
      }
      const newCollection = await this.cookBookApi.createRecipeCollection(name);
      this.collections.set([newCollection, ...this.collections()]);
      this.newCollectionName.set('');
      this.collectionUpdated.emit();
    } catch (error) {
      if ((error as any)?.statusCode === 409) {
        this.snackbar.error(
          'Eine Sammlung mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.',
        );
      } else {
        const msg = toErrorMessage(
          error,
          'Die Sammlung konnte nicht erstellt werden. Bitte versuche es später erneut.',
        );
        this.snackbar.error(msg);
      }
    } finally {
      this.createLoading.set(false);
    }
  }

  // Delete collection
  openDeleteCollection(col: CookbookCollection, ev: MouseEvent): void {
    ev.stopPropagation();
    this.error.set(null);
    this.deleteTargetId.set(col.id);
    this.deleteTargetMessage.set(col.name);
    this.deleteModalOpen.set(true);
  }

  confirmDelete(): void {
    const id = this.deleteTargetId();
    if (!id) return;
    this.cookBookApi
      .deleteRecipeCollection(id)
      .then(() => {
        this.collections.set(this.collections().filter((c) => c.id !== id));
        this.collectionUpdated.emit();
      })
      .catch((error) => {
        const msg = toErrorMessage(
          error,
          'Die Sammlung konnte nicht gelöscht werden. Bitte versuche es später erneut.',
        );
        this.snackbar.error(msg);
      })
      .finally(() => this.closeDeleteModal());
  }

  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.deleteTargetId.set(null);
    this.deleteTargetMessage.set(null);
  }
}
