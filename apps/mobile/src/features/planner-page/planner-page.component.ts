import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { BookOpen, ChefHat, ClipboardList } from '@cooksona/constants/icons';
import {
  TopTab,
  TopTabsComponent,
} from '../../layout/ui/top-tabs/top-tabs.component';
import { MealPlannerComponent } from './meal-planner/meal-planner.component';
import { ShoppingListComponent } from './shopping-list/shopping-list.component';
import { HistoryComponent } from './history/history.component';

@Component({
  selector: 'ns-planner-page',
  standalone: true,
  templateUrl: './planner-page.component.html',
  imports: [
    NativeScriptCommonModule,
    TopTabsComponent,
    MealPlannerComponent,
    ShoppingListComponent,
    HistoryComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlannerPageComponent {
  selected: 'plan' | 'list' | 'history' = 'plan';

  tabs: TopTab[] = [
    { key: 'plan', label: 'Mein Plan', iconSvg: ChefHat },
    { key: 'list', label: 'Einkaufsliste', iconSvg: ClipboardList },
    { key: 'history', label: 'Verlauf', iconSvg: BookOpen },
  ];
}
