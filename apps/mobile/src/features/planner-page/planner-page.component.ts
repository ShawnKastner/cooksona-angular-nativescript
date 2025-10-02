import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import {
  ModalDialogService,
  NativeScriptCommonModule,
} from '@nativescript/angular';
import { ActivatedRoute, Router } from '@angular/router';
import {
  BookOpen,
  Check,
  ChefHat,
  ClipboardList,
  Plus,
} from '@cooksona/constants/icons';
import {
  TopTab,
  TopTabsComponent,
} from '../../layout/ui/top-tabs/top-tabs.component';
import { MealPlannerComponent } from './meal-planner/meal-planner.component';
import { ShoppingListComponent } from './shopping-list/shopping-list.component';
import { HistoryComponent } from './history/history.component';
import { PlannerStore } from './planner.store';
import { MealPlanFormComponent } from './meal-plan-form/meal-plan-form.component';
import { SvgToDataUriPipe } from '../../utils/svg-to-data-uri.pipe';
import { Recipe } from '@cooksona/models';

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
    SvgToDataUriPipe,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlannerPageComponent implements OnInit {
  private readonly store = inject(PlannerStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  selected = signal<'plan' | 'list' | 'history'>('plan');
  isGenerating = signal(false);

  banner = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  planSelectedBanner = signal<{ text: string } | null>(null);
  // legacy sheet state removed in favor of router

  tabs: TopTab[] = [
    { key: 'plan', label: 'Mein Plan', iconSvg: ChefHat },
    { key: 'list', label: 'Einkaufsliste', iconSvg: ClipboardList },
    { key: 'history', label: 'Verlauf', iconSvg: BookOpen },
  ];

  icons = {
    Plus,
    Check,
  } as const;

  constructor(
    private modalService: ModalDialogService,
    private vcRef: ViewContainerRef,
  ) {}

  async ngOnInit() {
    // Load once per planner page scope
    await this.store.load();
  }

  onPlanSelected(_: boolean) {
    this.selected.set('plan');
    this.showPlanSelectedBanner(this.store.currentPlanDate());
  }

  private showPlanSelectedBanner(date: string | null) {
    if (!date) return;

    const formatted = this.formatDate(date);
    this.planSelectedBanner.set({ text: `Plan vom ${formatted} geladen` });
    setTimeout(() => {
      this.planSelectedBanner.set(null);
    }, 1500);
  }

  private showBanner(type: 'success' | 'error', text: string) {
    this.banner.set({ type, text });
    setTimeout(() => {
      this.banner.set(null);
    }, 1500);
  }

  formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  async openMealPlanForm() {
    try {
      const options = await this.modalService.showModal(MealPlanFormComponent, {
        viewContainerRef: this.vcRef,
        context: {},
        fullscreen: true,
        animated: true,
        stretched: true,
      });
      if (options) {
        this.isGenerating.set(true);
        try {
          await this.store.generatePlan(options);
          this.selected.set('plan');
        } catch (e) {
          this.showBanner('error', 'Der Plan konnte nicht erstellt werden.');
        } finally {
          this.isGenerating.set(false);
        }
      }
    } catch (e) {
      console.error('Failed to open meal plan form modal', e);
    }
  }

  // open recipe detail sheet from child with context
  onOpenRecipe(
    ev: { recipe: Recipe; dayName: string; mealKey: string } | null,
  ) {
    if (ev && ev.recipe && ev.recipe.id) {
      this.router.navigate(['/recipe', ev.recipe.id], {
        state: { recipe: ev.recipe, dayName: ev.dayName, mealKey: ev.mealKey },
      });
    }
  }
}
