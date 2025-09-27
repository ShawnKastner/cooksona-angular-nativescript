import { Component, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { ClipboardList, ListTree } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { ShoppingListItem } from '@cooksona/models';
import { PlannerStore } from '../planner.store';
import { TNSCheckBoxModule } from '@nstudio/nativescript-checkbox/angular';
import { AuthService } from '../../../../../../libs/auth';

@Component({
  selector: 'ns-shopping-list',
  templateUrl: './shopping-list.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe, TNSCheckBoxModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ShoppingListComponent {
  private readonly store = inject(PlannerStore);
  private readonly auth = inject(AuthService);

  // Collapsed categories (default empty => all open)
  collapsed = signal<Set<string>>(new Set());

  isUserPro = signal(this.auth.isProUser());
  isSorting = signal(false);
  sortError = signal<string | null>(null);

  // expose computed for template compatibility
  shoppingList = this.store.shoppingList;
  isCategorized = this.store.isCategorized;

  icons = {
    ClipboardList,
    ListTree,
  } as const;

  async ngOnInit() {}

  async sortByDepartment() {
    if (this.isSorting()) return;
    this.isSorting.set(true);
    this.sortError.set(null);
    try {
      await this.store.categorizeActiveShoppingList();
    } catch (e: any) {
      this.sortError.set(
        e?.message ??
          'Die Liste konnte nicht sortiert werden. Bitte versuche es später erneut.',
      );
    } finally {
      this.isSorting.set(false);
    }
  }

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
