import {
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import {
  TopTab,
  TopTabsComponent,
} from '../../layout/ui/top-tabs/top-tabs.component';
import { EventData, isIOS, SearchBar } from '@nativescript/core';
import { CookbookStore } from './cookbook.store';
import { CollectionsComponent } from './collections/collections.component';
import { RecipesComponent } from './recipes/recipes.component';

@Component({
  selector: 'ns-cookbook-page',
  templateUrl: './cookbook-page.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    TopTabsComponent,
    CollectionsComponent,
    RecipesComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  styles: `
    .search-wrapper {
      border-width: 1;
      border-color: #cfd8dc; /* helles Grau */
      border-radius: 14;
      padding: 2; /* etwas Abstand zwischen Border und SearchBar */
    }
  `,
})
export class CookbookPageComponent implements OnInit, OnDestroy {
  private readonly cookbookStore = inject(CookbookStore);

  selected = signal<'own-cookbook'>('own-cookbook');
  loading = this.cookbookStore.loading;
  searchTerm = this.cookbookStore.searchTerm;

  tabs: TopTab[] = [{ key: 'own-cookbook', label: 'Mein Kochbuch' }];
  icons = {} as const;

  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  async ngOnInit() {
    await this.cookbookStore.load();
  }

  ngOnDestroy() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }

  onSearchBarLoaded(args: any) {
    if (isIOS) {
      const searchBar = args.object as SearchBar;
      const iosBar = searchBar.ios as UISearchBar;

      // Remove the black background immediately when SearchBar loads
      iosBar.backgroundImage = UIImage.new();
      iosBar.barTintColor = UIColor.clearColor;
      iosBar.searchBarStyle = 2; // UISearchBarStyleMinimal

      if (iosBar.searchTextField) {
        iosBar.searchTextField.backgroundColor = UIColor.clearColor;
      }
    }
  }

  protected onSearchChange(event: EventData) {
    const searchBar = event.object as SearchBar;
    const term = searchBar?.text ?? '';
    this.scheduleSearch(term);
  }

  protected onSearchSubmit(event: EventData) {
    const searchBar = event.object as SearchBar;
    const term = searchBar?.text ?? '';
    this.scheduleSearch(term, true);
  }

  protected onSearchClear() {
    this.scheduleSearch('', true);
  }

  private scheduleSearch(term: string, immediate = false) {
    const normalized = term.trim();
    // Avoid duplicate requests if the normalized term has not changed
    if (normalized === this.cookbookStore.searchTerm()) {
      return;
    }

    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }

    const triggerLoad = () =>
      void this.cookbookStore.load({ search: normalized });

    if (immediate) {
      triggerLoad();
    } else {
      this.searchDebounceTimer = setTimeout(() => {
        triggerLoad();
        this.searchDebounceTimer = null;
      }, 300);
    }
  }
}
