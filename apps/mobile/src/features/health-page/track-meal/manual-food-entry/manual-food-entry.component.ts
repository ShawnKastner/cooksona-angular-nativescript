import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  inject,
  signal,
  OnDestroy,
} from '@angular/core';
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
import { alert } from '@nativescript/core/ui/dialogs';
import { ArrowLeft } from '@cooksona/constants/icons';
import { HealthStore } from '../../health.store';
import { getDateString } from '@cooksona/models';
import { Subscription } from 'rxjs';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

@Component({
  selector: 'ns-manual-food-entry',
  templateUrl: './manual-food-entry.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ManualFoodEntryComponent implements OnInit, OnDestroy {
  private readonly healthStore = inject(HealthStore);
  private readonly route = inject(ActivatedRoute);

  manualFoodForm!: FormGroup;
  isSaving = signal(false);
  formValid = signal(false);
  mealType: MealType = 'breakfast'; // Default to breakfast

  private formSubscription?: Subscription;

  icons = {
    ArrowLeft,
  };

  constructor(
    private fb: FormBuilder,
    private routerExtensions: RouterExtensions,
  ) {}

  ngOnInit(): void {
    // Get mealType from query params
    this.route.queryParams.subscribe((params) => {
      if (params['mealType']) {
        this.mealType = params['mealType'] as MealType;
      }
    });

    this.manualFoodForm = this.fb.group({
      name: ['', Validators.required],
      calories: [0, [Validators.required, Validators.min(0)]],
      protein: [0, [Validators.required, Validators.min(0)]],
      carbs: [0, [Validators.required, Validators.min(0)]],
      fat: [0, [Validators.required, Validators.min(0)]],
      salt: [0, [Validators.min(0)]],
      sugar: [0, [Validators.min(0)]],
      fiber: [0, [Validators.min(0)]],
      saturatedFat: [0, [Validators.min(0)]],
    });

    // Track form validity
    this.formSubscription = this.manualFoodForm.statusChanges.subscribe(() => {
      this.formValid.set(this.manualFoodForm.valid);
    });

    this.manualFoodForm.valueChanges.subscribe(() => {
      this.formValid.set(this.manualFoodForm.valid);
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
  }

  async trackManualFood(): Promise<void> {
    if (!this.manualFoodForm.valid || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    try {
      const formValue = this.manualFoodForm.value;

      await this.healthStore.createMeal({
        name: formValue.name,
        sourceType: 'manual',
        mealType: this.mealType,
        calories: parseInt(formValue.calories, 10),
        protein: parseInt(formValue.protein, 10),
        carbs: parseInt(formValue.carbs, 10),
        fat: parseInt(formValue.fat, 10),
        salt: formValue.salt ? parseInt(formValue.salt, 10) : null,
        sugar: formValue.sugar ? parseInt(formValue.sugar, 10) : null,
        fiber: formValue.fiber ? parseInt(formValue.fiber, 10) : null,
        saturatedFat: formValue.saturatedFat
          ? parseInt(formValue.saturatedFat, 10)
          : null,
        date: getDateString(this.healthStore.selectedDate()),
      });

      // Navigate back on success
      this.routerExtensions.back();
    } catch (error) {
      console.error('Error saving meal:', error);
      alert({
        title: 'Fehler',
        message:
          'Mahlzeit konnte nicht gespeichert werden. Bitte versuche es erneut.',
        okButtonText: 'OK',
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack(): void {
    this.routerExtensions.back();
  }
}
