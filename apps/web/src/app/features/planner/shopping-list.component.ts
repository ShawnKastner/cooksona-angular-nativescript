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
import { ListTree } from 'libs/constants/icons';

interface CategoryBlock {
  category: string;
  items: ShoppingListItem[];
}

@Component({
  selector: 'app-shopping-list',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective],
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
          <svg
            class="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
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
  }

  async handleToggle(itemId: string): Promise<void> {
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
      await this.plans.updateShoppingList(this.planId, this.list);
      if (this.categorizedList) {
        await this.plans.saveCategorizedShoppingList(
          this.planId,
          this.categorizedList as unknown as CategorizedShoppingList
        );
      }
    } catch (err) {
      console.error(err);
    }
  }

  async handleSortList(): Promise<void> {
    this.isSorting = true;
    this.sortError = null;
    try {
      const rawIngredients: Ingredient[] = this.list.map(
        ({ name, amount, unit }) => ({ name, amount, unit })
      );
      const sortedRaw = (await this.api.apiCategorizeShoppingList<
        Ingredient,
        { category: string; items: Ingredient[] }[]
      >(rawIngredients))!;

      const categoryBlocks: CategoryBlock[] = sortedRaw.map((category) => ({
        category: (category as any).category,
        items: (category.items || []).map((item: Ingredient) => {
          const existing = this.list.find(
            (i) =>
              i.name === item.name &&
              i.amount === item.amount &&
              i.unit === item.unit
          );
          return (existing ?? {
            ...item,
            id: this.generateId(),
            checked: false,
          }) as ShoppingListItem;
        }),
      }));

      const updatedPlan = await this.plans.saveCategorizedShoppingList(
        this.planId,
        categoryBlocks
      );
      if (updatedPlan) {
        this.categorized.emit(updatedPlan);
      }
      this.categorizedList = categoryBlocks;
    } catch (err: any) {
      this.sortError =
        err?.message ?? 'Die Liste konnte nicht sortiert werden.';
    } finally {
      this.isSorting = false;
    }
  }

  private generateId(): string {
    try {
      if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
      }
    } catch {}
    return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private fromRecord(
    record: CategorizedShoppingList | null
  ): CategoryBlock[] | null {
    return record ? (record as CategoryBlock[]) : null;
  }
}
