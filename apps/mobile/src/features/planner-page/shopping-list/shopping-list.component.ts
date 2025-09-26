import {
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  computed,
  signal,
} from '@angular/core';
import { ClipboardList } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { ShoppingListItem } from '@cooksona/models';
import { PlannerStore } from '../planner.store';
import { TNSCheckBoxModule } from '@nstudio/nativescript-checkbox/angular';

@Component({
  selector: 'ns-shopping-list',
  templateUrl: './shopping-list.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe, TNSCheckBoxModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ShoppingListComponent {
  private readonly store = inject(PlannerStore);

  // Collapsed categories (default empty => all open)
  collapsed = signal<Set<string>>(new Set());

  // expose computed for template compatibility
  shoppingList = this.store.shoppingList;

  icons = {
    ClipboardList,
  } as const;

  async ngOnInit() {}

  toggleItem(category: string, item: ShoppingListItem) {
    // Optimistic flip: compute next state and delegate to store
    const nextChecked = !item.checked;
    this.store.toggleShoppingItem(item.id, nextChecked, category);
  }

  toggleCategory(id: string) {
    const next = new Set(this.collapsed());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    this.collapsed.set(next);
  }

  isCollapsed(id: string) {
    return this.collapsed().has(id);
  }
}
