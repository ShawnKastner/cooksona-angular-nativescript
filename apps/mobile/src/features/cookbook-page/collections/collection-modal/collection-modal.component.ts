import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import {
  ModalDialogParams,
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { CookbookApiService } from '@cooksona/api';

@Component({
  selector: 'ns-collection-modal',
  templateUrl: './collection-modal.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class NewCollectionModalComponent {
  form!: FormGroup;
  isValid = signal(false);
  errorMessage = signal<string | null>(null);
  isLoading = signal(false);
  isEditMode = signal(false);
  modalTitle = signal('Neue Sammlung');
  private cookbookApi!: CookbookApiService;
  private collectionId: string | null = null;

  constructor(
    private params: ModalDialogParams,
    private fb: FormBuilder,
  ) {
    this.cookbookApi = this.params.context?.cookbookApi;

    // Check if we're in edit mode
    const editMode = this.params.context?.editMode || false;
    const initialName = this.params.context?.initialName || '';
    this.collectionId = this.params.context?.collectionId || null;

    this.isEditMode.set(editMode);
    if (editMode) {
      this.modalTitle.set('Sammlung bearbeiten');
    }

    this.form = this.fb.group({
      name: [initialName, Validators.required],
    });

    // Track form validity
    this.form.statusChanges.subscribe(() => {
      this.isValid.set(this.form.valid);
    });
  }

  close() {
    this.params.closeCallback();
  }

  async create() {
    if (this.form.valid && !this.isLoading()) {
      const name = this.form.get('name')?.value?.trim();
      if (name) {
        this.isLoading.set(true);
        this.errorMessage.set(null);

        try {
          if (this.isEditMode() && this.collectionId) {
            // Update existing collection
            await this.cookbookApi.renameRecipeCollection(
              this.collectionId,
              name,
            );
          } else {
            // Create new collection
            await this.cookbookApi.createRecipeCollection(name);
          }
          // Close modal and return the name on success
          this.params.closeCallback(name);
        } catch (error: any) {
          // Handle API errors
          this.isLoading.set(false);

          if (
            error?.statusCode === 409 ||
            error?.message?.includes('already exists')
          ) {
            this.errorMessage.set(
              'Eine Sammlung mit diesem Namen existiert bereits.',
            );
          } else if (error?.message) {
            this.errorMessage.set(error.message);
          } else {
            const action = this.isEditMode() ? 'aktualisiert' : 'erstellt';
            this.errorMessage.set(
              `Die Sammlung konnte nicht ${action} werden.`,
            );
          }
        }
      }
    }
  }

  onNameChange() {
    // Update validity signal when name changes
    this.isValid.set(this.form.valid);
    // Clear error message when user starts typing
    if (this.errorMessage()) {
      this.errorMessage.set(null);
    }
  }
}
