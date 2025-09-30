import { Component, inject, NO_ERRORS_SCHEMA, signal } from "@angular/core";
import { NativeScriptCommonModule } from "@nativescript/angular";
import { CookbookStore } from "../cookbook.store";

@Component({
    selector: 'ns-collections',
    templateUrl: './collections.component.html',
    standalone: true,
    imports: [
        NativeScriptCommonModule,
    ],
    schemas: [NO_ERRORS_SCHEMA],
})
export class CollectionsComponent {
    private readonly cookbookStore = inject(CookbookStore);

    selectedCollectionId = signal<string | null>('all');

    cookbookCollection = this.cookbookStore.collections;

    async selectCollection(id: string) {
    // track selected collection locally for UI state
    this.selectedCollectionId.set(id ?? 'all');
    // ask the store to load recipes for the collection
    await this.cookbookStore.load(id === 'all' ? undefined : id);
  }
}