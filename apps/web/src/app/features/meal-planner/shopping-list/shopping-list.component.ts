import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { ApiService, PlanApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';
import {
  Ingredient,
  MealPlan,
  ShoppingListItem,
  CategorizedShoppingList,
} from '@cooksona/models/plan.models';
import { ListTree } from '@cooksona/constants/icons';
import { toErrorMessage } from '../../../shared/utils/error.utils';
import { LoadingSpinnerSmallComponent } from '../../../shared/ui/loading-spinner/loading-spinner-small.component';

interface CategoryBlock {
  category: string;
  items: ShoppingListItem[];
}

interface CategorizedResponse {
  category: string;
  items: Ingredient[];
}

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective, LoadingSpinnerSmallComponent],
  templateUrl: './shopping-list.component.html',
})
export class ShoppingListComponent implements OnChanges {
  @Input() planId!: string;
  @Input() shoppingList: ShoppingListItem[] = [];
  @Input() categorizedShoppingList: CategorizedShoppingList | null | undefined =
    null;
  @Output() categorized = new EventEmitter<MealPlan>();

  list = signal<ShoppingListItem[]>([]);
  categorizedList = signal<CategoryBlock[] | null>(null);
  isSorting = signal(false);
  sortError = signal<string | null>(null);
  listError = signal<string | null>(null);

  readonly icons = { ListTree } as const;

  constructor(
    private readonly auth: AuthService,
    private readonly api: ApiService,
    private readonly plans: PlanApiService,
  ) {}

  get isProUser(): boolean {
    try {
      return this.auth.isProUser();
    } catch {
      return true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.list.set([...(this.shoppingList ?? [])]);
    this.categorizedList.set(
      this.fromRecord(this.categorizedShoppingList ?? null),
    );
    this.isSorting.set(false);
    this.sortError.set(null);
    this.listError.set(null);
  }

  async handleToggle(itemId: string): Promise<void> {
    this.listError.set(null);
    const previousList = this.list().map((item) => ({ ...item }));
    const previousCategorized = this.cloneCategoryBlocks(
      this.categorizedList(),
    );

    this.list.set(
      this.list().map((i) =>
        i.id === itemId ? { ...i, checked: !i.checked } : i,
      ),
    );

    const currentCategorized = this.categorizedList();
    if (currentCategorized) {
      // update local and prepare record for save
      this.categorizedList.set(
        currentCategorized.map((cat) => ({
          category: cat.category,
          items: cat.items.map((i) =>
            i.id === itemId ? { ...i, checked: !i.checked } : i,
          ),
        })),
      );
    }

    try {
      const updatedPlan = await this.plans.updateShoppingList(
        this.planId,
        this.list(),
      );
      if (!updatedPlan) {
        throw new Error('Die Einkaufsliste konnte nicht gespeichert werden.');
      }

      let latestPlan = updatedPlan;

      if (this.categorizedList) {
        const categorizedPlan = await this.plans.saveCategorizedShoppingList(
          this.planId,
          this.ensureCategorizedPayload(this.categorizedList()),
        );
        if (!categorizedPlan) {
          throw new Error(
            'Die kategorisierte Einkaufsliste konnte nicht gespeichert werden.',
          );
        }
        latestPlan = categorizedPlan;
        this.categorized.emit(categorizedPlan);
      }

      this.list.set([...(latestPlan.shoppingList ?? this.list())]);
      const latestCategorized =
        latestPlan.categorizedShoppingList ??
        this.toCategorizedShoppingList(this.categorizedList());
      this.categorizedList.set(this.fromRecord(latestCategorized));
    } catch (error) {
      this.list.set(previousList);
      this.categorizedList.set(previousCategorized);
      this.listError.set(
        toErrorMessage(
          error,
          'Die Änderungen konnten nicht gespeichert werden. Bitte versuche es später erneut.',
        ),
      );
    }
  }

  async handleSortList(): Promise<void> {
    this.isSorting.set(true);
    this.sortError.set(null);
    this.listError.set(null);
    const previousCategorized = this.cloneCategoryBlocks(
      this.categorizedList(),
    );
    try {
      const rawIngredients: Ingredient[] = this.list().map(
        ({ name, amount, unit }) => ({ name, amount, unit }),
      );
      const sortedRaw = await this.api.apiCategorizeShoppingList<
        Ingredient,
        CategorizedResponse[]
      >(rawIngredients);

      if (!sortedRaw) {
        throw new Error('Die Liste konnte nicht sortiert werden.');
      }

      const categoryBlocks: CategoryBlock[] = sortedRaw.map((category) => {
        const items = (category.items ?? []).map((item) => {
          const existing = this.list().find(
            (i) =>
              i.name === item.name &&
              i.amount === item.amount &&
              i.unit === item.unit,
          );
          if (existing) {
            return { ...existing };
          }
          const newItem: ShoppingListItem = {
            ...item,
            id: this.generateId(),
            checked: false,
          };
          return newItem;
        });
        return { category: category.category, items };
      });

      const updatedPlan = await this.plans.saveCategorizedShoppingList(
        this.planId,
        categoryBlocks,
      );
      if (!updatedPlan) {
        throw new Error(
          'Die sortierte Einkaufsliste konnte nicht gespeichert werden.',
        );
      }
      this.categorized.emit(updatedPlan);
      const latestCategorized =
        updatedPlan.categorizedShoppingList ??
        this.toCategorizedShoppingList(categoryBlocks);
      this.categorizedList.set(this.fromRecord(latestCategorized));
      this.list.set([...(updatedPlan.shoppingList ?? this.list())]);
    } catch (error) {
      this.categorizedList.set(previousCategorized);
      this.sortError.set(
        toErrorMessage(
          error,
          'Die Liste konnte nicht sortiert werden. Bitte versuche es später erneut.',
        ),
      );
    } finally {
      this.isSorting.set(false);
    }
  }

  private generateId(): string {
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
    } catch (error) {
      console.warn('Falling back to timestamp-based id generation', error);
    }
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private ensureCategorizedPayload(
    blocks: CategoryBlock[] | null,
  ): CategorizedShoppingList {
    const payload = this.toCategorizedShoppingList(blocks);
    if (!payload) {
      throw new Error('Die kategorisierte Einkaufsliste ist leer.');
    }
    return payload;
  }

  private fromRecord(
    record: CategorizedShoppingList | null,
  ): CategoryBlock[] | null {
    if (!record) return null;
    return record.map((category) => ({
      category: category.category,
      items: category.items.map((item) => ({ ...item })),
    }));
  }

  private cloneCategoryBlocks(
    blocks: CategoryBlock[] | null,
  ): CategoryBlock[] | null {
    if (!blocks) return null;
    return blocks.map((category) => ({
      category: category.category,
      items: category.items.map((item) => ({ ...item })),
    }));
  }

  private toCategorizedShoppingList(
    blocks: CategoryBlock[] | null,
  ): CategorizedShoppingList | null {
    if (!blocks) return null;
    return blocks.map((category) => ({
      category: category.category,
      items: category.items.map((item) => ({ ...item })),
    }));
  }
}
