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
import { isIOS } from '@nativescript/core';
import { CookbookCollection } from '@cooksona/models';
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
export class CookbookPageComponent implements AfterViewInit, OnInit {
  @ViewChild('sb', { static: true }) sb!: ElementRef<any>;
  private readonly cookbookStore = inject(CookbookStore);

  selected = signal<'own-cookbook'>('own-cookbook');

  tabs: TopTab[] = [{ key: 'own-cookbook', label: 'Mein Kochbuch' }];
  icons = {} as const;

  async ngOnInit() {
    await this.cookbookStore.load();
  }

  ngAfterViewInit() {
    if (isIOS) {
      const iosBar = this.sb.nativeElement.ios as UISearchBar;

      // Remove the black background
      iosBar.backgroundImage = UIImage.new();
      iosBar.barTintColor = UIColor.clearColor;

      (iosBar as any).searchBarStyle = 2;

      if (iosBar.searchTextField) {
        iosBar.searchTextField.backgroundColor = UIColor.clearColor;
      }
    }
  }
}
