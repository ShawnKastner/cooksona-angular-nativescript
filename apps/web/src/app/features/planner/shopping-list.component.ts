import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { ApiService, PlanApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';
import {
  Ingredient,
  MealPlan,
  ShoppingListItem,
  CategorizedShoppingList,
} from '@cooksona/models/plan.models';
import { ListTree } from '@cooksona/constants/icons';
import { toErrorMessage } from '../../shared/utils/error.utils';
import { LoadingSpinnerSmallComponent } from '../../shared/ui/loading-spinner-small.component';

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
  template: `
    <div class="bg-white p-2 md:p-4 rounded-2xl">
      @if(isProUser && !categorizedShoppingList) {
      <div class="mb-4 text-right non-printable">
        <button
          (click)="handleSortList()"
          [disabled]="isSorting"
          class="inline-flex items-center gap-2 bg-secondary/20 text-secondary-focus font-semibold px-4 py-2 rounded-lg hover:bg-secondary/30 transition-colors disabled:opacity-50 disabled:cursor-wait"
        >
          @if(isSorting) {
          <app-loading-spinner-small />
          Sortiere... }@else {
          <span class="w-5 h-5" [svgInject]="icons.ListTree"></span>
          Nach Abteilung sortieren }
        </button>
      </div>
      } @if(sortError) {
      <div
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
        role="alert"
      >
        <span class="block sm:inline">{{ sortError }}</span>
      </div>
      } @if(listError) {
      <div
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-4"
        role="alert"
      >
        <span class="block sm:inline">{{ listError }}</span>
      </div>
      } @if(list.length > 0) { @if(categorizedList) {
      <div class="space-y-6">
        @for(cat of categorizedList; track cat) {
        <div>
          <h3
            class="font-serif font-bold text-xl text-primary border-b-2 border-primary/20 pb-2 mb-3"
          >
            {{ cat.category }}
          </h3>
          <div
            id="shopping-list-grid"
            class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"
          >
            @for(item of cat.items; track item) {
            <label
              class="flex items-center space-x-4 p-3 rounded-lg hover:bg-base-100/50 transition-colors cursor-pointer group"
            >
              <input
                type="checkbox"
                [checked]="item.checked"
                (change)="handleToggle(item.id)"
                class="h-5 w-5 rounded-md border-gray-300 text-primary focus:ring-primary focus:ring-offset-2 cursor-pointer"
              />
              <span
                class="text-neutral group-hover:text-primary transition-colors"
                [ngClass]="item.checked ? 'line-through text-gray-400' : ''"
              >
                <span class="font-semibold">{{
                  (item.amount + ' ' + item.unit).trim()
                }}</span>
                {{ item.name }}
              </span>
            </label>
            }
          </div>
        </div>
        }
      </div>
      }@else {
      <div
        id="shopping-list-grid"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"
      >
        @for(item of list; track item) {
        <label
          class="flex items-center space-x-4 p-3 rounded-lg hover:bg-base-100/50 transition-colors cursor-pointer group"
        >
          <input
            type="checkbox"
            [checked]="item.checked"
            (change)="handleToggle(item.id)"
            class="h-5 w-5 rounded-md border-gray-300 text-primary focus:ring-primary focus:ring-offset-2 cursor-pointer"
          />
          <span
            class="text-neutral group-hover:text-primary transition-colors"
            [ngClass]="item.checked ? 'line-through text-gray-400' : ''"
          >
            <span class="font-semibold">{{
              (item.amount + ' ' + item.unit).trim()
            }}</span>
            {{ item.name }}
          </span>
        </label>
        }
      </div>
      } }@else {
      <div class="bg-base-200 p-8 rounded-2xl text-center">
        <p class="text-gray-500">Deine Einkaufsliste ist leer.</p>
      </div>
      }
    </div>
  `,
})
export class ShoppingListComponent implements OnChanges {
  @Input() planId!: string;
  @Input() shoppingList: ShoppingListItem[] = [];
  @Input() categorizedShoppingList: CategorizedShoppingList | null | undefined =
    null;
  @Output() categorized = new EventEmitter<MealPlan>();

  list: ShoppingListItem[] = [];
  categorizedList: CategoryBlock[] | null = null;
  isSorting = false;
  sortError: string | null = null;
  listError: string | null = null;

  readonly icons = { ListTree } as const;

  constructor(
    private readonly auth: AuthService,
    private readonly api: ApiService,
    private readonly plans: PlanApiService
  ) {}

  get isProUser(): boolean {
    // placeholder: use AuthService helper if available
    try {
      return this.auth.isProUser();
    } catch {
      return true;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.list = [...(this.shoppingList ?? [])];
    this.categorizedList = this.fromRecord(
      this.categorizedShoppingList ?? null
    );
    this.isSorting = false;
    this.sortError = null;
    this.listError = null;
  }

  async handleToggle(itemId: string): Promise<void> {
    this.listError = null;
    const previousList = this.list.map((item) => ({ ...item }));
    const previousCategorized = this.cloneCategoryBlocks(this.categorizedList);

    this.list = this.list.map((i) =>
      i.id === itemId ? { ...i, checked: !i.checked } : i
    );

    if (this.categorizedList) {
      // update local and prepare record for save
      this.categorizedList = this.categorizedList.map((cat) => ({
        category: cat.category,
        items: cat.items.map((i) =>
          i.id === itemId ? { ...i, checked: !i.checked } : i
        ),
      }));
    }

    try {
      const updatedPlan = await this.plans.updateShoppingList(
        this.planId,
        this.list
      );
      if (!updatedPlan) {
        throw new Error('Die Einkaufsliste konnte nicht gespeichert werden.');
      }

      let latestPlan = updatedPlan;

      if (this.categorizedList) {
        const categorizedPlan = await this.plans.saveCategorizedShoppingList(
          this.planId,
          this.ensureCategorizedPayload(this.categorizedList)
        );
        if (!categorizedPlan) {
          throw new Error(
            'Die kategorisierte Einkaufsliste konnte nicht gespeichert werden.'
          );
        }
        latestPlan = categorizedPlan;
        this.categorized.emit(categorizedPlan);
      }

      this.list = [...(latestPlan.shoppingList ?? this.list)];
      const latestCategorized =
        latestPlan.categorizedShoppingList ??
        this.toCategorizedShoppingList(this.categorizedList);
      this.categorizedList = this.fromRecord(latestCategorized);
    } catch (error) {
      this.list = previousList;
      this.categorizedList = previousCategorized;
      this.listError = toErrorMessage(
        error,
        'Die Änderungen konnten nicht gespeichert werden. Bitte versuche es später erneut.'
      );
    }
  }

  async handleSortList(): Promise<void> {
    this.isSorting = true;
    this.sortError = null;
    this.listError = null;
    const previousCategorized = this.cloneCategoryBlocks(this.categorizedList);
    try {
      const rawIngredients: Ingredient[] = this.list.map(
        ({ name, amount, unit }) => ({ name, amount, unit })
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
          const existing = this.list.find(
            (i) =>
              i.name === item.name &&
              i.amount === item.amount &&
              i.unit === item.unit
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
        categoryBlocks
      );
      if (!updatedPlan) {
        throw new Error(
          'Die sortierte Einkaufsliste konnte nicht gespeichert werden.'
        );
      }
      this.categorized.emit(updatedPlan);
      const latestCategorized =
        updatedPlan.categorizedShoppingList ??
        this.toCategorizedShoppingList(categoryBlocks);
      this.categorizedList = this.fromRecord(latestCategorized);
      this.list = [...(updatedPlan.shoppingList ?? this.list)];
    } catch (error) {
      this.categorizedList = previousCategorized;
      this.sortError = toErrorMessage(
        error,
        'Die Liste konnte nicht sortiert werden. Bitte versuche es später erneut.'
      );
    } finally {
      this.isSorting = false;
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
    blocks: CategoryBlock[]
  ): CategorizedShoppingList {
    const payload = this.toCategorizedShoppingList(blocks);
    if (!payload) {
      throw new Error('Die kategorisierte Einkaufsliste ist leer.');
    }
    return payload;
  }

  private fromRecord(
    record: CategorizedShoppingList | null
  ): CategoryBlock[] | null {
    if (!record) return null;
    return record.map((category) => ({
      category: category.category,
      items: category.items.map((item) => ({ ...item })),
    }));
  }

  private cloneCategoryBlocks(
    blocks: CategoryBlock[] | null
  ): CategoryBlock[] | null {
    if (!blocks) return null;
    return blocks.map((category) => ({
      category: category.category,
      items: category.items.map((item) => ({ ...item })),
    }));
  }

  private toCategorizedShoppingList(
    blocks: CategoryBlock[] | null
  ): CategorizedShoppingList | null {
    if (!blocks) return null;
    return blocks.map((category) => ({
      category: category.category,
      items: category.items.map((item) => ({ ...item })),
    }));
  }
}
