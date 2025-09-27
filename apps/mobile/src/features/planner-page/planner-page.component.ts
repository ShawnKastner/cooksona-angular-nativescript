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
import {
  BookOpen,
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
import { RecipeDetailViewComponent } from './recipe-detail-view/recipe-detail-view.component';
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
    RecipeDetailViewComponent,
  ],
  providers: [PlannerStore],
  schemas: [NO_ERRORS_SCHEMA],
})
export class PlannerPageComponent implements OnInit {
  private readonly store = inject(PlannerStore);
  selected = signal<'plan' | 'list' | 'history'>('plan');
  isGenerating = signal(false);

  banner = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  showRecipeSheet = signal(false);
  selectedRecipe = signal<Recipe | null>(null);

  tabs: TopTab[] = [
    { key: 'plan', label: 'Mein Plan', iconSvg: ChefHat },
    { key: 'list', label: 'Einkaufsliste', iconSvg: ClipboardList },
    { key: 'history', label: 'Verlauf', iconSvg: BookOpen },
  ];

  icons = {
    Plus,
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
    this.showBanner('success', 'Plan ausgewählt');
  }

  private showBanner(type: 'success' | 'error', text: string) {
    this.banner.set({ type, text });
    setTimeout(() => {
      this.banner.set(null);
    }, 1500);
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

  // open recipe detail sheet from child
  onOpenRecipe(recipe: Recipe | null) {
    if (recipe && recipe.id) {
      this.selectedRecipe.set(recipe);
      this.showRecipeSheet.set(true);
    } else {
      this.selectedRecipe.set(null);
      this.showRecipeSheet.set(false);
    }
  }

  // close handler for sheet
  closeRecipeSheet() {
    this.showRecipeSheet.set(false);
  }
}
