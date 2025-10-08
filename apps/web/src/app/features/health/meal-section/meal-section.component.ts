import { Component, computed, input, signal } from '@angular/core';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import type { MealEntry } from '@cooksona/api';
import { icons } from '@cooksona/constants/icons';

interface MealSection {
  key: MealEntry['mealType'];
  label: string;
  icon: string;
  calories: number;
  items: MealEntry[];
}

@Component({
  selector: 'app-meal-section',
  standalone: true,
  imports: [SvgInjectDirective],
  template: `
    <div class="bg-white rounded-2xl shadow-soft border border-base-200">
      <header
        class="p-6 border-b border-base-200 flex items-center justify-between"
      >
        <div>
          <h3 class="text-lg font-serif font-bold text-neutral">Mahlzeiten</h3>
          <p class="text-sm text-gray-500">
            Übersicht der erfassten Mahlzeiten für den ausgewählten Tag.
          </p>
        </div>
      </header>

      @if (sections().length === 0) {
        <div class="p-6 text-sm text-gray-500">
          Noch keine Mahlzeiten für diesen Tag erfasst.
        </div>
      } @else {
        <div class="divide-y divide-base-200">
          @for (section of sections(); track section.key) {
            <button
              type="button"
              class="w-full text-left p-6 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              (click)="toggle(section.key)"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <span
                    [svgInject]="section.icon"
                    class="w-8 h-8 text-primary"
                  ></span>
                  <div>
                    <p class="font-semibold text-neutral">
                      {{ section.label }}
                    </p>
                    <p class="text-xs text-gray-500">
                      {{ section.items.length }} Einträge •
                      {{ section.calories | number: '1.0-0' }} kcal
                    </p>
                  </div>
                </div>
                <span
                  [svgInject]="icons.ChevronDown"
                  class="w-5 h-5 text-gray-400 transition-transform duration-200"
                  [style.transform]="
                    expanded() === section.key
                      ? 'rotate(180deg)'
                      : 'rotate(0deg)'
                  "
                ></span>
              </div>
            </button>

            @if (expanded() === section.key) {
              <div class="px-6 pb-6 space-y-3 bg-base-100/60">
                @for (item of section.items; track item.id) {
                  <div
                    class="p-4 bg-white rounded-xl border border-base-200 shadow-sm"
                  >
                    <div class="flex justify-between items-center">
                      <div>
                        <p class="font-semibold text-neutral">
                          {{ item.name }}
                        </p>
                        <p class="text-xs text-gray-500 capitalize">
                          {{ item.mealType }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="text-sm font-semibold text-primary">
                          {{ item.calories | number: '1.0-0' }} kcal
                        </p>
                        <p class="text-xs text-gray-500">
                          P {{ item.protein | number: '1.0-0' }} • K
                          {{ item.carbs | number: '1.0-0' }} • F
                          {{ item.fat | number: '1.0-0' }}
                        </p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
      }
    </div>
  `,
})
export class MealSectionComponent {
  protected readonly icons = icons;

  meals = input<MealEntry[]>([]);

  private sectionConfig: Record<
    MealEntry['mealType'],
    { label: string; icon: string }
  > = {
    breakfast: { label: 'Frühstück', icon: icons.Soup },
    lunch: { label: 'Mittagessen', icon: icons.Sandwich },
    dinner: { label: 'Abendessen', icon: icons.Utensils },
    snacks: { label: 'Snacks', icon: icons.Cookie },
  } as const;

  protected expanded = signal<MealEntry['mealType'] | null>(null);

  protected sections = computed<MealSection[]>(() => {
    const meals = this.meals() ?? [];
    const groups: MealSection[] = Object.entries(this.sectionConfig).map(
      ([key, value]) => ({
        key: key as MealEntry['mealType'],
        label: value.label,
        icon: value.icon,
        calories: 0,
        items: [],
      }),
    );

    meals.forEach((meal) => {
      const group = groups.find((g) => g.key === meal.mealType);
      if (group) {
        group.items.push(meal);
        group.calories += meal.calories;
      }
    });

    return groups.filter((group) => group.items.length > 0);
  });

  protected toggle(key: MealEntry['mealType']): void {
    const current = this.expanded();
    this.expanded.set(current === key ? null : key);
  }
}
