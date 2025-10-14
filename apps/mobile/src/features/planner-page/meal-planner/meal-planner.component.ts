import {
  Component,
  NO_ERRORS_SCHEMA,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  CakeSlice,
  ChefHat,
  Cookie,
  Plus,
  Sandwich,
  Soup,
  Utensils,
} from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { PlannerStore } from '../planner.store';
import { DailyPlan, Recipe } from '@cooksona/models';
import { PullToRefresh } from '@nativescript-community/ui-pulltorefresh';

type MealKey = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

@Component({
  selector: 'ns-meal-planner',
  templateUrl: './meal-planner.component.html',
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
})
export class MealPlannerComponent {
  private readonly store = inject(PlannerStore);
  openRecipe = output<{
    recipe: Recipe;
    dayName: string;
    mealKey: MealKey;
  } | null>();

  openAddMealPlan = signal(false);

  icons = {
    ChefHat,
    Plus,
  } as const;

  plans = this.store.plans;
  activePlan = this.store.activePlan;
  swappingMealId = this.store.swappingMealId;

  mealKeys: ReadonlyArray<MealKey> = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
    'dessert',
  ] as const;

  getMeal(day: DailyPlan, key: MealKey): Recipe | undefined {
    return day[key];
  }

  getColorForIcon(key: MealKey): string {
    switch (key) {
      case 'breakfast':
        return '#F5B90B';
      case 'lunch':
        return '#F97316';
      case 'dinner':
        return '#EF4444';
      case 'snack':
        return '#84CC16';
      case 'dessert':
        return '#EC4899';
      default:
        return '';
    }
  }

  mealIcon(key: MealKey): string | null {
    switch (key) {
      case 'breakfast':
        return Soup;
      case 'lunch':
        return Sandwich;
      case 'dinner':
        return Utensils;
      case 'snack':
        return Cookie;
      case 'dessert':
        return CakeSlice;
      default:
        return null;
    }
  }

  mealTranslation(key: MealKey): string {
    switch (key) {
      case 'breakfast':
        return 'Frühstück';
      case 'lunch':
        return 'Mittagessen';
      case 'dinner':
        return 'Abendessen';
      case 'snack':
        return 'Snack';
      case 'dessert':
        return 'Dessert';
      default:
        return key;
    }
  }

  openDetailView(dayName: string, mealKey: MealKey, meal?: Recipe) {
    if (meal) {
      this.openRecipe.emit({ recipe: meal, dayName, mealKey });
    } else {
      this.openRecipe.emit(null);
    }
  }

  async onRefresh(event: { object: PullToRefresh }): Promise<void> {
    const refresher = event?.object;
    try {
      await this.store.load();
    } finally {
      if (refresher) {
        refresher.refreshing = false;
      }
    }
  }
}
