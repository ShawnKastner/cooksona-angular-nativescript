import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
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
import { RecipeDetailModalComponent } from '../../shared/ui/modals/recipe-detail-modal.component';
import { RecipeTransformModalComponent } from '../../shared/ui/modals/recipe-transform-modal.component';
import { LeftOverModalComponent } from '../../shared/ui/modals/left-over-modal.component';
import { LoadingSpinnerComponent } from '../../shared/ui/loading-spinner.component';
import { ProUpgradeModalComponent } from '../../shared/ui/modals/pro-upgrade-modal.component';
import { DeleteConfirmModalComponent } from '../../shared/ui/modals/delete-confirm-modal.component';

type ActiveTab = 'current' | 'shopping-list' | 'history';

@Component({
  selector: 'app-planner-page',
  standalone: true,
  imports: [
    CommonModule,
    MealPlannerFormComponent,
    MealPlanDisplayComponent,
    SvgInjectDirective,
    TabsComponent,
    HistoryComponent,
    ShoppingListComponent,
    LoadingSpinnerComponent,
    RecipeDetailModalComponent,
    RecipeTransformModalComponent,
    LeftOverModalComponent,
    ProUpgradeModalComponent,
    DeleteConfirmModalComponent,
  ],
  templateUrl: './planner.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly planApi = inject(PlanApiService);
  private readonly cookbookApi = inject(CookbookApiService);

  // State
  isLoading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<ActiveTab>('current');
  swappingMealId = signal<string | null>(null);
  isRecipeModalOpen = signal(false);
  selectedRecipe = signal<Recipe | null>(null);
  isTransformModalOpen = signal(false);
  recipeToTransform = signal<Recipe | null>(null);
  isLeftoverModalOpen = signal(false);
  isProUpgradeModalOpen = signal(false);
  isDeletePlanModalOpen = signal(false);
  planPendingDeleteId = signal<string | null>(null);

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

  requestDeletePlan(id: string): void {
    this.planPendingDeleteId.set(id);
    this.isDeletePlanModalOpen.set(true);
  }

  cancelDeletePlan(): void {
    this.isDeletePlanModalOpen.set(false);
    setTimeout(() => this.planPendingDeleteId.set(null), 200);
  }

  async confirmDeletePlan(): Promise<void> {
    const id = this.planPendingDeleteId();
    if (!id) return;
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
    } finally {
      this.cancelDeletePlan();
    }
  }

  pendingPlanDetails(): string {
    const id = this.planPendingDeleteId();
    if (!id) return '';
    const plan = this.mealPlanHistory().find((p) => p.id === id);
    if (!plan) return '';
    try {
      const date = new Date(plan.createdAt).toLocaleDateString('de-DE');
      return `Plan vom ${date} wird gelöscht.`;
    } catch {
      return 'Dieser Plan wird gelöscht.';
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
    this.selectedRecipe.set(this.getEnrichedRecipe(recipe));
    this.isRecipeModalOpen.set(true);
  }

  handleOpenTransformModal(recipe: Recipe): void {
    this.recipeToTransform.set(this.getEnrichedRecipe(recipe));
    this.isTransformModalOpen.set(true);
  }

  handleCloseRecipeModal(): void {
    this.isRecipeModalOpen.set(false);
    setTimeout(() => this.selectedRecipe.set(null), 200);
  }

  handleCloseTransformModal(): void {
    this.isTransformModalOpen.set(false);
    setTimeout(() => this.recipeToTransform.set(null), 200);
  }

  openLeftoverModal(): void {
    this.isLeftoverModalOpen.set(true);
  }
  handleCloseLeftoverModal(): void {
    this.isLeftoverModalOpen.set(false);
  }

  async handleSaveLeftoverRecipe(recipe: Recipe): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;
    try {
      await this.cookbookApi.addRecipeToCookbook(recipe);
      const set = new Set(this.favoriteRecipeIds());
      set.add(recipe.id);
      this.favoriteRecipeIds.set(set);
    } catch (err) {
      console.error('Fehler beim Speichern des Resterezepts', err);
      this.error.set('Rezept konnte nicht gespeichert werden.');
    }
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

  async handleTransformComplete(ev: {
    originalRecipeId: string;
    transformedRecipe: Recipe;
    action: 'updateInPlan' | 'saveAsCopy';
  }): Promise<void> {
    const user = this.auth.currentUser;
    const activeId = this.activePlanId();
    if (!user || !activeId) return;
    if (ev.action === 'updateInPlan') {
      const updatedPlan = await this.planApi.updateRecipeInPlan(
        activeId,
        ev.originalRecipeId,
        ev.transformedRecipe
      );
      if (updatedPlan) {
        this.mealPlanHistory.set(
          this.mealPlanHistory().map((p) =>
            p.id === activeId ? updatedPlan : p
          )
        );
      }
    } else if (ev.action === 'saveAsCopy') {
      await this.cookbookApi.addRecipeToCookbook(ev.transformedRecipe);
      const set = new Set(this.favoriteRecipeIds());
      set.add(ev.transformedRecipe.id);
      this.favoriteRecipeIds.set(set);
    }
    this.handleCloseTransformModal();
  }

  openUpgradeModal(): void {
    this.isProUpgradeModalOpen.set(true);
  }
  handleCloseProUpgradeModal(): void {
    this.isProUpgradeModalOpen.set(false);
  }
}
