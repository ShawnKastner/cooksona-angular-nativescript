import {
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  signal,
  ViewContainerRef,
} from '@angular/core';
import {
  NativeScriptCommonModule,
  ModalDialogService,
} from '@nativescript/angular';
import { CookbookStore } from '../cookbook.store';
import { Plus } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { NewCollectionModalComponent } from './collection-modal/collection-modal.component';
import { CookbookApiService } from '@cooksona/api';
import { CookbookCollection } from '@cooksona/models';
import { action } from '@nativescript/core/ui/dialogs';

@Component({
  selector: 'ns-collections',
  templateUrl: './collections.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class CollectionsComponent {
  private readonly cookbookStore = inject(CookbookStore);
  private readonly modalService = inject(ModalDialogService);
  private readonly vcRef = inject(ViewContainerRef);
  private readonly cookbookApi = inject(CookbookApiService);

  selectedCollectionId = signal<string | null>('all');
  private isActionSheetOpen = signal(false);

  cookbookCollection = this.cookbookStore.collections;

  loading = this.cookbookStore.loading;

  icons = {
    Plus,
  };

  async selectCollection(id: string) {
    // track selected collection locally for UI state
    this.selectedCollectionId.set(id ?? 'all');
    // ask the store to load recipes for the collection
    await this.cookbookStore.load(id === 'all' ? undefined : id);
  }

  async openNewCollectionModal() {
    try {
      const collectionName = await this.modalService.showModal(
        NewCollectionModalComponent,
        {
          viewContainerRef: this.vcRef,
          context: { cookbookApi: this.cookbookApi },
          fullscreen: false,
          transition: {},
          stretched: false,
          animated: false,
        },
      );

      if (collectionName && typeof collectionName === 'string') {
        // Reload collections to show the new one
        await this.cookbookStore.load();
      }
    } catch (e) {
      console.error('Failed to open collection modal', e);
    }
  }

  async onCollectionLongPress(collection: CookbookCollection) {
    // Prevent multiple action sheets from opening
    if (this.isActionSheetOpen()) {
      return;
    }

    this.isActionSheetOpen.set(true);

    try {
      const result = await action({
        message: collection.name,
        cancelButtonText: 'Abbrechen',
        actions: ['Bearbeiten', 'Löschen'],
      });

      if (result === 'Bearbeiten') {
        await this.editCollection(collection);
      } else if (result === 'Löschen') {
        await this.deleteCollection(collection);
      }
    } catch (e) {
      console.error('Failed to show collection actions', e);
    } finally {
      // Reset the flag after a short delay to allow the action sheet to fully close
      setTimeout(() => {
        this.isActionSheetOpen.set(false);
      }, 300);
    }
  }

  async editCollection(collection: CookbookCollection) {
    try {
      const newName = await this.modalService.showModal(
        NewCollectionModalComponent,
        {
          viewContainerRef: this.vcRef,
          context: {
            cookbookApi: this.cookbookApi,
            editMode: true,
            collectionId: collection.id,
            initialName: collection.name,
          },
          fullscreen: false,
          transition: {},
          stretched: false,
          animated: false,
        },
      );

      if (newName && typeof newName === 'string') {
        // Reload collections to show the updated one
        await this.cookbookStore.load();
      }
    } catch (e) {
      console.error('Failed to edit collection', e);
    }
  }

  async deleteCollection(collection: CookbookCollection) {
    try {
      const confirmed = await action({
        message: `Möchtest du die Sammlung "${collection.name}" wirklich löschen?`,
        cancelButtonText: 'Abbrechen',
        actions: ['Löschen'],
      });

      if (confirmed === 'Löschen') {
        try {
          await this.cookbookApi.deleteRecipeCollection(collection.id);
        } catch (apiError: any) {
          // Log the error but continue - the delete might have succeeded even if parsing failed
          console.log(
            'Delete API response parsing error (might still be successful):',
            apiError,
          );
        }

        // If we deleted the currently selected collection, switch to 'all'
        if (this.selectedCollectionId() === collection.id) {
          this.selectedCollectionId.set('all');
        }

        // Always reload collections to verify the actual state
        await this.cookbookStore.load();
      }
    } catch (e) {
      console.error('Failed to delete collection', e);
    }
  }
}
