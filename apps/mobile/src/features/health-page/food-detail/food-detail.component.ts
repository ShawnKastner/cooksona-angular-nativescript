import { Component, NO_ERRORS_SCHEMA, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterExtensions } from '@nativescript/angular';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import { Food, NutritionalValues } from '@cooksona/models';
import { MealTrackingService } from '../../../core/services/meal-tracking.service';
import { alert } from '@nativescript/core/ui/dialogs';
import { ArrowLeft } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

@Component({
  selector: 'ns-food-detail',
  templateUrl: './food-detail.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
    SvgToDataUriPipe,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class FoodDetailComponent implements OnInit {
  food: Food | null = null;
  portionForm!: FormGroup;
  calculatedNutrition: NutritionalValues | null = null;

  icons = {
    ArrowLeft,
  };

  constructor(
    private fb: FormBuilder,
    private mealTrackingService: MealTrackingService,
    private routerExtensions: RouterExtensions,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    const foodId = this.route.snapshot.params['id'];
    this.food = this.mealTrackingService.getFoodById(foodId) || null;

    if (!this.food) {
      alert('Lebensmittel nicht gefunden').then(() => {
        this.goBack();
      });
      return;
    }

    this.portionForm = this.fb.group({
      portionGrams: [
        this.food.servingSize || 100,
        [Validators.required, Validators.min(1)],
      ],
    });

    // Calculate nutrition on value changes
    this.portionForm.get('portionGrams')?.valueChanges.subscribe(() => {
      this.calculateNutrition();
    });

    // Initial calculation
    this.calculateNutrition();
  }

  calculateNutrition(): void {
    if (!this.food) return;

    const portionGrams = this.portionForm.get('portionGrams')?.value || 0;
    this.calculatedNutrition = this.mealTrackingService.calculateNutrition(
      this.food.nutritionalValues,
      portionGrams,
    );
  }

  trackFood(): void {
    if (!this.food || this.portionForm.invalid) {
      alert('Bitte gib eine gültige Menge ein');
      return;
    }

    const portionGrams = this.portionForm.get('portionGrams')?.value;
    const userId = 'current-user'; // TODO: get from auth service

    this.mealTrackingService.trackMeal(userId, this.food, portionGrams);

    alert({
      title: 'Erfolg',
      message: 'Mahlzeit erfolgreich gespeichert!',
      okButtonText: 'OK',
    }).then(() => {
      this.goBack();
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
