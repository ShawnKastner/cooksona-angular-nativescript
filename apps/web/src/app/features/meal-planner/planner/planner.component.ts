import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MealPlannerFormComponent } from '../meal-planner-form/meal-planner-form.component';
import { MealPlanDisplayComponent } from '../meal-plan-display/meal-plan-display.component';
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
} from '@cooksona/constants/icons';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { TabsComponent } from '../tabs/tabs.component';
import { HistoryComponent } from '../history/history.component';
import { ShoppingListComponent } from '../shopping-list/shopping-list.component';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { toErrorMessage } from '../../../shared/utils/error.utils';
import { DeleteConfirmModalComponent } from '../../../shared/ui/modals/delete-confirm-modal/delete-confirm-modal.component';
import { LeftOverModalComponent } from '../../../shared/ui/modals/left-over-modal/left-over-modal.component';
import { ProUpgradeModalComponent } from '../../../shared/ui/modals/pro-upgrade-modal/pro-upgrade-modal.component';
import { RecipeDetailModalComponent } from '../../../shared/ui/modals/recipe-detail-modal/recipe-detail-modal.component';
import { RecipeTransformModalComponent } from '../../../shared/ui/modals/recipe-transform-modal/recipe-transform-modal.component';
import { RecipeTrackModalComponent } from '../../../shared/ui/modals/recipe-track-modal/recipe-track-modal.component';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';

type ActiveTab = 'current' | 'shopping-list' | 'history';
type MealField = Exclude<keyof DailyPlan, 'day'>;
const MEAL_FIELDS: MealField[] = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert',
];

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
    RecipeTrackModalComponent,
    LeftOverModalComponent,
    ProUpgradeModalComponent,
    DeleteConfirmModalComponent,
  ],
  templateUrl: './planner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlannerComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly planApi = inject(PlanApiService);
  private readonly cookbookApi = inject(CookbookApiService);
  private readonly snackbar = inject(SnackbarService);

  // State
  isLoading = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<ActiveTab>('current');
  swappingMealId = signal<string | null>(null);
  isRecipeModalOpen = signal(false);
  selectedRecipe = signal<Recipe | null>(null);
  isTransformModalOpen = signal(false);
  recipeToTransform = signal<Recipe | null>(null);
  isTrackModalOpen = signal(false);
  recipeToTrack = signal<Recipe | null>(null);
  isLeftoverModalOpen = signal(false);
  isProUpgradeModalOpen = signal(false);
  isDeletePlanModalOpen = signal(false);
  planPendingDeleteId = signal<string | null>(null);

  mealPlanHistory = signal<MealPlan[]>([]);
  activePlanId = signal<string | null>(null);
  favoriteRecipeIds = signal<Set<string>>(new Set());
  // Basic pro logic placeholders (replace with real subscription logic later)
  isProUser = signal(false);
  remainingRequests = signal<number>(5);

  // Derived
  activePlan = computed(
    () =>
      this.mealPlanHistory().find((p) => p.id === this.activePlanId()) || null,
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
      this.isProUser.set(this.auth.isProUser());
      this.remainingRequests.set(this.auth.getRemainingRequests());
      this.mealPlanHistory.set(plans);
      if (plans.length > 0) this.activePlanId.set(plans[0].id);
      // Normalize recipe ids to strings for consistent Set membership checks
      this.favoriteRecipeIds.set(
        new Set((cookbook ?? []).map((r) => String(r.id))),
      );
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Deine Planungsdaten konnten nicht geladen werden. Bitte versuche es später erneut.',
        ),
      );
    }
  }

  setActiveTab(tab: ActiveTab | string): void {
    this.activeTab.set(tab as ActiveTab);
  }

  print(): void {
    try {
      window.print();
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Der Druck konnte nicht gestartet werden. Bitte verwende die Druckfunktion deines Browsers.',
        ),
      );
    }
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
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Plan konnte nicht gelöscht werden. Bitte versuche es später erneut.',
        ),
      );
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
      p.id === updatedPlan.id ? updatedPlan : p,
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
        'Dein Freikontingent ist aufgebraucht. Upgrade erforderlich.',
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

      const planData = await this.api.apiGenerateMealPlan<
        PlannerOptions,
        { days: DailyPlan[]; shoppingList: Ingredient[] }
      >(planOptions);

      if (!planData) {
        throw new Error('Plan konnte nicht generiert werden.');
      }

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
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Der Plan konnte nicht erstellt werden. Bitte versuche es später erneut.',
        ),
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

  handleTrackRecipe(recipe: Recipe): void {
    this.isRecipeModalOpen.set(false);
    setTimeout(() => {
      this.recipeToTrack.set(this.getEnrichedRecipe(recipe));
      this.isTrackModalOpen.set(true);
    }, 120);
  }

  handleRequestAddNutrition(recipe: Recipe): void {
    this.isRecipeModalOpen.set(false);
    setTimeout(() => this.handleOpenTransformModal(recipe), 150);
  }

  handleCloseRecipeModal(): void {
    this.isRecipeModalOpen.set(false);
    setTimeout(() => this.selectedRecipe.set(null), 200);
  }

  handleCloseTransformModal(): void {
    this.isTransformModalOpen.set(false);
    setTimeout(() => this.recipeToTransform.set(null), 200);
  }

  handleCloseTrackModal(): void {
    this.isTrackModalOpen.set(false);
    setTimeout(() => this.recipeToTrack.set(null), 200);
  }

  handleRecipeTracked(): void {
    this.handleCloseTrackModal();
    this.snackbar.success('Rezept wurde zum Ernährungstagebuch übernommen.');
  }

  openLeftoverModal(): void {
    this.isLeftoverModalOpen.set(true);
  }
  handleCloseLeftoverModal(): void {
    this.isLeftoverModalOpen.set(false);
  }

  async handleSaveLeftoverRecipe(recipe: Recipe | null): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      this.error.set('Bitte melde dich an, um Rezepte zu speichern.');
      return;
    }
    try {
      if (!recipe) {
        return;
      }
      await this.cookbookApi.addRecipeToCookbook(recipe);
      const set = new Set(this.favoriteRecipeIds());
      set.add(String(recipe.id));
      this.favoriteRecipeIds.set(set);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Das Rezept konnte nicht gespeichert werden. Bitte versuche es später erneut.',
        ),
      );
    }
  }

  async handleToggleFavorite(recipe: Recipe): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) {
      this.error.set('Bitte melde dich an, um Favoriten zu verwalten.');
      return;
    }
    const enriched = this.getEnrichedRecipe(recipe);
    const id = String(enriched.id);
    const currentFavorites = new Set(this.favoriteRecipeIds());
    const isFav = currentFavorites.has(id);
    // Optimistic update: toggle immediately for snappy UI
    const optimistic = new Set(currentFavorites);
    if (isFav) {
      optimistic.delete(id);
    } else {
      optimistic.add(id);
    }
    this.favoriteRecipeIds.set(optimistic);
    try {
      if (isFav) {
        await this.cookbookApi.removeRecipeFromCookbook(id);
      } else {
        await this.cookbookApi.addRecipeToCookbook(enriched);
      }
    } catch (error) {
      // Revert optimistic update on error
      this.favoriteRecipeIds.set(currentFavorites);
      this.error.set(
        toErrorMessage(
          error,
          isFav
            ? 'Der Favorit konnte nicht entfernt werden. Bitte versuche es später erneut.'
            : 'Das Rezept konnte nicht als Favorit gespeichert werden. Bitte versuche es später erneut.',
        ),
      );
    }
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

      const otherMealNames = MEAL_FIELDS.map((key) => day[key])
        .filter((meal): meal is Recipe => !!meal)
        .map((meal) => meal.name);

      const recipeHadNutrition = !!ev.recipe.nutrition;
      const newRecipe = await this.api.apiGenerateSingleMeal<
        PlannerOptions,
        Recipe
      >({
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
      });

      if (!newRecipe)
        throw new Error('Neues Rezept konnte nicht generiert werden.');

      const updatedPlan = await this.planApi.swapMealInPlan(
        active.id,
        ev.dayName,
        ev.mealKey,
        newRecipe,
      );
      if (updatedPlan) {
        this.mealPlanHistory.set(
          this.mealPlanHistory().map((p) =>
            p.id === updatedPlan.id ? updatedPlan : p,
          ),
        );
      } else {
        throw new Error(
          'Der Plan konnte nach dem Tausch nicht aktualisiert werden.',
        );
      }
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Der Austausch des Rezepts ist fehlgeschlagen. Bitte versuche es später erneut.',
        ),
      );
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
    if (!user || !activeId) {
      this.error.set('Bitte melde dich an, um Rezepte zu bearbeiten.');
      return;
    }

    const currentFavorites = new Set(this.favoriteRecipeIds());
    let shouldCloseModal = true;

    try {
      if (ev.action === 'updateInPlan') {
        const updatedPlan = await this.planApi.updateRecipeInPlan(
          activeId,
          ev.originalRecipeId,
          ev.transformedRecipe,
        );
        if (!updatedPlan) {
          throw new Error(
            'Der aktualisierte Plan wurde nicht gespeichert. Bitte versuche es erneut.',
          );
        }
        this.mealPlanHistory.set(
          this.mealPlanHistory().map((p) =>
            p.id === activeId ? updatedPlan : p,
          ),
        );
      } else if (ev.action === 'saveAsCopy') {
        await this.cookbookApi.addRecipeToCookbook(ev.transformedRecipe);
        const updatedFavorites = new Set(currentFavorites);
        updatedFavorites.add(ev.transformedRecipe.id);
        this.favoriteRecipeIds.set(updatedFavorites);
      }
    } catch (error) {
      shouldCloseModal = false;
      this.favoriteRecipeIds.set(currentFavorites);
      const fallback =
        ev.action === 'updateInPlan'
          ? 'Das Rezept konnte nicht im Plan aktualisiert werden. Bitte versuche es später erneut.'
          : 'Das Rezept konnte nicht gespeichert werden. Bitte versuche es später erneut.';
      this.error.set(toErrorMessage(error, fallback));
    } finally {
      if (shouldCloseModal) {
        this.handleCloseTransformModal();
      }
    }
  }

  openUpgradeModal(): void {
    this.isProUpgradeModalOpen.set(true);
  }

  handleCloseProUpgradeModal(): void {
    this.isProUpgradeModalOpen.set(false);
  }
}
