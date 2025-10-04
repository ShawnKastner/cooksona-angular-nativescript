import { Component, NO_ERRORS_SCHEMA, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterExtensions } from '@nativescript/angular';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import { Food } from '@cooksona/models';
import { MealTrackingService } from '../../../core/services/meal-tracking.service';
import { ArrowLeft } from '@cooksona/constants/icons';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

interface MealTypeOption {
  type: MealType;
  label: string;
  emoji: string;
}

@Component({
  selector: 'ns-track-meal',
  templateUrl: './track-meal.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TrackMealComponent implements OnInit {
  searchForm!: FormGroup;
  foods: Food[] = [];
  selectedMealType = signal<MealType>(this.getDefaultMealTypeByTime());

  mealTypeOptions: MealTypeOption[] = [
    { type: 'breakfast', label: 'Frühstück', emoji: '🌅' },
    { type: 'lunch', label: 'Mittagessen', emoji: '🌞' },
    { type: 'dinner', label: 'Abendessen', emoji: '🌙' },
    { type: 'snacks', label: 'Snacks', emoji: '🍿' },
  ];

  icons = {
    ArrowLeft,
  };

  constructor(
    private fb: FormBuilder,
    private mealTrackingService: MealTrackingService,
    private routerExtensions: RouterExtensions,
  ) {}

  /**
   * Determines the default meal type based on current time of day
   * 05:00-10:30 → breakfast
   * 10:31-15:00 → lunch
   * 15:01-21:00 → dinner
   * 21:01-04:59 → snack
   */
  private getDefaultMealTypeByTime(): MealType {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const timeInMinutes = hour * 60 + minute;

    // 05:00 - 10:30
    if (timeInMinutes >= 5 * 60 && timeInMinutes <= 10 * 60 + 30) {
      return 'breakfast';
    }
    // 10:31 - 15:00
    else if (timeInMinutes >= 10 * 60 + 31 && timeInMinutes <= 15 * 60) {
      return 'lunch';
    }
    // 15:01 - 21:00
    else if (timeInMinutes >= 15 * 60 + 1 && timeInMinutes <= 21 * 60) {
      return 'dinner';
    }
    // 21:01 - 04:59 (late night / early morning)
    else {
      return 'snacks';
    }
  }

  ngOnInit(): void {
    this.searchForm = this.fb.group({
      searchQuery: [''],
    });

    // Load all foods initially
    this.foods = this.mealTrackingService.searchFoods('');

    // Search as user types
    this.searchForm.get('searchQuery')?.valueChanges.subscribe((query) => {
      this.onSearch(query);
    });
  }

  selectMealType(type: MealType): void {
    this.selectedMealType.set(type);
  }

  onSearch(query: string): void {
    this.foods = this.mealTrackingService.searchFoods(query);
  }

  selectFood(food: Food): void {
    this.routerExtensions.navigate(['/food-detail', food.id], {
      queryParams: { mealType: this.selectedMealType() },
    });
  }

  goToManualEntry(): void {
    this.routerExtensions.navigate(['/manual-food-entry'], {
      queryParams: { mealType: this.selectedMealType() },
    });
  }

  goBack(): void {
    this.routerExtensions.back();
  }

  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      fruit: 'Obst',
      vegetable: 'Gemüse',
      meat: 'Fleisch',
      fish: 'Fisch',
      dairy: 'Milchprodukt',
      grain: 'Getreide',
      snack: 'Snack',
      beverage: 'Getränk',
      other: 'Sonstiges',
    };
    return labels[category] || category;
  }
}
