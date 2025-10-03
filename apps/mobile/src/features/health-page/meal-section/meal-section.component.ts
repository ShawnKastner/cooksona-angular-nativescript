import { Component, inject, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { HealthStore } from '../health.store';
import {
  ArrowLeft,
  ArrowRight,
  Dumbbell,
  Apple,
  Droplet,
  Flame,
  Soup,
  Sandwich,
  Utensils,
  Cookie,
  ChevronDown,
} from '@cooksona/constants/icons';

@Component({
  selector: 'ns-meal-section',
  templateUrl: './meal-section.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
})
export class MealSectionComponent {
  private readonly store = inject(HealthStore);

  protected expandedMeal = signal<string | null>(null);

  protected readonly icons = {
    Soup,
    Sandwich,
    Cookie,
    ChevronDown,
  } as const;

  // temporary mock meal data to illustrate UI layout
  protected readonly mealSections = signal([
    {
      key: 'breakfast',
      label: 'Frühstück',
      icon: this.icons.Soup,
      calories: 450,
      items: [{ name: 'Haferflocken mit Beeren', calories: 450 }],
    },
    {
      key: 'lunch',
      label: 'Mittagessen',
      icon: this.icons.Sandwich,
      calories: 600,
      items: [{ name: 'Vegane Buddha Bowl', calories: 600 }],
    },
    {
      key: 'snack',
      label: 'Snack',
      icon: this.icons.Cookie,
      calories: 350,
      items: [
        { name: 'Protein-Shake', calories: 250 },
        { name: 'Apfel', calories: 100 },
      ],
    },
  ]);

  protected toggleMeal(key: string): void {
    const current = this.expandedMeal();
    this.expandedMeal.set(current === key ? null : key);
  }
}
