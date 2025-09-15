import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealPlannerFormComponent } from '../meal-planner/meal-planner-form.component';
import { MealPlanDisplayComponent } from '../meal-planner/meal-plan-display.component';
import {
  PlannerOptions,
  MealPlan,
  Ingredient,
  DailyPlan,
} from '@cooksona/models/plan.models';
import { Recipe } from '@cooksona/models/recipe.models';
import { ApiService, CookbookApiService, PlanApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';
import { SeoComponent } from '../../shared/seo/seo.component';
import {
  ClipboardList,
  ClipboardCheck,
  BookOpen,
  ChefHat,
  ShoppingBasket,
  Printer,
  Recycle,
  UtensilsCrossed,
} from 'libs/constants/icons';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { TabsComponent } from './tabs.component';
import { HistoryComponent } from './history.component';
import { ShoppingListComponent } from './shopping-list.component';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner.component';

type ActiveTab = 'current' | 'shopping-list' | 'history';

@Component({
  selector: 'app-planner-page',
  standalone: true,
  imports: [
    CommonModule,
    MealPlannerFormComponent,
    MealPlanDisplayComponent,
    SeoComponent,
    SvgInjectDirective,
    TabsComponent,
    HistoryComponent,
    ShoppingListComponent,
    LoadingSpinnerComponent
  ],
  templateUrl: './planner.page.html',
})
export class PlannerPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly planApi = inject(PlanApiService);
  private readonly cookbookApi = inject(CookbookApiService);

  // State
  isLoading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<ActiveTab>('current');
  swappingMealId = signal<string | null>(null);

  mealPlanHistory = signal<MealPlan[]>([]);
  activePlanId = signal<string | null>(null);
  favoriteRecipeIds = signal<Set<string>>(new Set());

  // Derived
  activePlan = computed(
    () =>
      this.mealPlanHistory().find((p) => p.id === this.activePlanId()) || null
  );

  // Icons for template
  readonly icons = {
    ClipboardList,
    ClipboardCheck,
    BookOpen,
    ChefHat,
    ShoppingBasket,
    Printer,
    Recycle,
    UtensilsCrossed,
  } as const;

  // Basic pro logic placeholders (replace with real subscription logic later)
  isProUser = signal(true);
  remainingRequests = signal<number>(3);

  navTabs = [
    { id: 'current', label: 'Aktueller Plan', icon: this.icons.ClipboardList },
    {
      id: 'shopping-list',
      label: 'Einkaufsliste',
      icon: this.icons.ClipboardCheck,
    },
    { id: 'history', label: 'Verlauf', icon: this.icons.BookOpen },
  ];

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    try {
      const [plans, cookbook] = await Promise.all([
        this.planApi.getPlansForUser(),
        this.cookbookApi.getCookbookForUser(),
      ]);
      this.mealPlanHistory.set(plans);
      if (plans.length > 0) this.activePlanId.set(plans[0].id);
      this.favoriteRecipeIds.set(new Set((cookbook ?? []).map((r) => r.id)));
    } catch (e) {
      console.error('Fehler beim Laden der Pläne oder des Kochbuchs', e);
      this.error.set('Daten konnten nicht geladen werden.');
    }
  }

  setActiveTab(tab: ActiveTab | string): void {
    this.activeTab.set(tab as ActiveTab);
  }

  print(): void {
    try {
      window.print();
    } catch {}
  }

  selectPlan(id: string): void {
    this.activePlanId.set(id);
    this.activeTab.set('current');
  }

  async deletePlan(id: string): Promise<void> {
    if (!confirm('Plan wirklich löschen?')) return;
    try {
      await this.planApi.deletePlanForUser(id);
      const updated = this.mealPlanHistory().filter((p) => p.id !== id);
      this.mealPlanHistory.set(updated);
      if (this.activePlanId() === id) {
        this.activePlanId.set(updated.length > 0 ? updated[0].id : null);
        if (updated.length === 0) this.activeTab.set('current');
      }
    } catch (err) {
      console.error('Fehler beim Löschen des Plans', err);
      this.error.set('Plan konnte nicht gelöscht werden.');
    }
  }

  handleShoppingListCategorized(updatedPlan: MealPlan): void {
    const updated = this.mealPlanHistory().map((p) =>
      p.id === updatedPlan.id ? updatedPlan : p
    );
    this.mealPlanHistory.set(updated);
  }

  async handleGeneratePlan(options: PlannerOptions): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      this.error.set('Bitte melde dich an, um einen Plan zu erstellen.');
      return;
    }

    if (!this.isProUser() && this.remainingRequests() <= 0) {
      this.error.set(
        'Dein Freikontingent ist aufgebraucht. Upgrade erforderlich.'
      );
      this.openUpgradeModal();
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    this.activePlanId.set(null);
    try {
      const planOptions: PlannerOptions = this.isProUser()
        ? options
        : {
            ...options,
            enableNutritionAnalysis: false,
            planFocus: 'ausgewogen',
            gourmetMode: false,
          };

      const planData = (await this.api.apiGenerateMealPlan<
        PlannerOptions,
        { days: DailyPlan[]; shoppingList: Ingredient[] }
      >(planOptions))!;

      if (!this.isProUser()) {
        this.remainingRequests.set(Math.max(0, this.remainingRequests() - 1));
      }

      const newPlan = await this.planApi.createPlanForUser({
        options: planOptions,
        days: planData.days,
        shoppingList: planData.shoppingList,
      });

      if (newPlan) {
        const updated = [newPlan, ...this.mealPlanHistory()];
        this.mealPlanHistory.set(updated);
        this.activePlanId.set(newPlan.id);
        this.activeTab.set('current');
      }
    } catch (err: any) {
      console.error(err);
      this.error.set(
        err?.message ??
          'Ein unbekannter Fehler ist aufgetreten. Bitte erneut versuchen.'
      );
    } finally {
      this.isLoading.set(false);
    }
  }

  private getEnrichedRecipe(recipe: Recipe): Recipe {
    if (recipe.servings && recipe.servings > 0) return recipe;
    const p = this.activePlan();
    const servings = p?.options?.people || 2;
    return { ...recipe, servings };
  }

  handleShowRecipe(recipe: Recipe): void {
    // TODO: open recipe modal; currently no-op
    console.log('Show recipe', this.getEnrichedRecipe(recipe));
  }

  async handleToggleFavorite(recipe: Recipe): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    const enriched = this.getEnrichedRecipe(recipe);
    const set = new Set(this.favoriteRecipeIds());
    const isFav = set.has(enriched.id);
    if (isFav) {
      await this.cookbookApi.removeRecipeFromCookbook(enriched.id);
      set.delete(enriched.id);
    } else {
      await this.cookbookApi.addRecipeToCookbook(enriched);
      set.add(enriched.id);
    }
    this.favoriteRecipeIds.set(set);
  }

  handleOpenTransformModal(recipe: Recipe): void {
    // TODO: open transform modal; currently no-op
    console.log('Open transform modal for', this.getEnrichedRecipe(recipe));
  }

  async handleSwapMeal(ev: {
    dayName: string;
    mealKey: string;
    recipe: Recipe;
  }): Promise<void> {
    const user = this.auth.currentUser;
    const active = this.activePlan();
    if (!user || !active) {
      this.error.set('Plan konnte nicht gefunden werden.');
      return;
    }
    this.swappingMealId.set(ev.recipe.id);
    this.error.set(null);
    try {
      const day = active.days.find((d) => d.day === ev.dayName);
      if (!day) throw new Error('Tag nicht im Plan gefunden.');

      const otherMealNames = Object.values(day)
        .filter(
          (m): m is Recipe =>
            typeof m === 'object' && m !== null && 'id' in (m as any)
        )
        .map((m) => (m as Recipe).name as string);

      const recipeHadNutrition = !!ev.recipe.nutrition;
      const newRecipe = (await this.api.apiGenerateSingleMeal({
        planOptions: active.options ?? {
          people: 2,
          planDays: 7,
          cookTime: '30 Minuten',
          meals: {
            breakfast: true,
            lunch: true,
            dinner: true,
            snack: false,
            dessert: false,
          },
          enableNutritionAnalysis: false,
          planFocus: 'ausgewogen',
          gourmetMode: false,
        },
        mealType: ev.mealKey,
        otherMealNames,
        recipeHadNutrition,
      })) as Recipe | undefined;

      if (!newRecipe)
        throw new Error('Neues Rezept konnte nicht generiert werden.');

      const updatedPlan = await this.planApi.swapMealInPlan(
        active.id,
        ev.dayName,
        ev.mealKey,
        newRecipe
      );
      if (updatedPlan) {
        this.mealPlanHistory.set(
          this.mealPlanHistory().map((p) =>
            p.id === updatedPlan.id ? updatedPlan : p
          )
        );
      } else {
        throw new Error(
          'Der Plan konnte nach dem Tausch nicht aktualisiert werden.'
        );
      }
    } catch (err: any) {
      console.error(err);
      this.error.set(err?.message ?? 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      this.swappingMealId.set(null);
    }
  }

  openUpgradeModal(): void {
    // TODO: integrate real upgrade modal
    alert('Upgrade auf Pro ist erforderlich, um fortzufahren.');
  }

  openLeftoverModal(): void {
    // TODO: implement leftover modal
    alert('Resteverwerter demnächst verfügbar.');
  }
}
