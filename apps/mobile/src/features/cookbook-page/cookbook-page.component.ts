import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  NO_ERRORS_SCHEMA,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import {
  TopTab,
  TopTabsComponent,
} from '../../layout/ui/top-tabs/top-tabs.component';
import { isIOS, SearchBar } from '@nativescript/core';
import { CookbookStore } from './cookbook.store';
import { CollectionsComponent } from './collections/collections.component';
import { RecipesComponent } from './recipes/recipes.component';
import { ios } from '@nativescript/core/utils';

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
export class CookbookPageComponent implements OnInit {
  private readonly cookbookStore = inject(CookbookStore);

  selected = signal<'own-cookbook'>('own-cookbook');
  loading = this.cookbookStore.loading;

  tabs: TopTab[] = [{ key: 'own-cookbook', label: 'Mein Kochbuch' }];
  icons = {} as const;

  async ngOnInit() {
    await this.cookbookStore.load();
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
}
