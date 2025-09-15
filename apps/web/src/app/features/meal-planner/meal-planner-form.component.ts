import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup } from '@angular/forms';
import { PlannerOptions } from '@cooksona/models/plan.models';
import {
  Sparkles,
  BarChart2,
  Target,
  Award,
  Leaf,
  ShieldBan,
  Users,
  CalendarDays,
  Clock,
  Flame,
  Check,
  ChevronDown,
} from 'libs/constants/icons';
import { AuthService } from '@cooksona/auth';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';

@Component({
  selector: 'app-meal-planner-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SvgInjectDirective],
  templateUrl: './meal-planner-form.component.html',
})
export class MealPlannerFormComponent implements OnChanges {
  @Input() isLoading = false;
  @Input() isProUser = false;
  @Input() remainingRequests: number | null = null;
  @Output() submitPlan = new EventEmitter<PlannerOptions>();
  @Output() showUpgradeModal = new EventEmitter<void>();

  readonly icons = { Sparkles, BarChart2, Target, Award, Leaf, ShieldBan, Users, CalendarDays, Clock, Flame, Check, ChevronDown } as const;

  readonly mealTypes = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'] as const;
  readonly mealTypeTranslations: Record<string, string> = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
    dessert: 'Dessert',
  };

  form!: FormGroup;

  showPlanDaysHint = false;

  constructor(private readonly fb: FormBuilder, public readonly auth: AuthService) {
    this.form = this.fb.group({
      diet: [''],
      allergies: [''],
      people: [2, [Validators.required, Validators.min(1), Validators.max(10)]],
      planDays: [7, [Validators.required, Validators.min(1), Validators.max(14)]],
      cookTime: ['30 Minuten', Validators.required],
      calories: [2000, [Validators.min(0), Validators.max(10000)]],
      meals: this.fb.group({
        breakfast: [true],
        lunch: [true],
        dinner: [true],
        snack: [false],
        dessert: [false],
      }),
      enableNutritionAnalysis: [false],
      planFocus: ['ausgewogen', Validators.required],
      gourmetMode: [false],
    });

    this.form.get('planDays')!.valueChanges.subscribe(() => this.onPlanDaysChange());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isProUser']) {
      if (this.isProUser) {
        this.form.patchValue({ enableNutritionAnalysis: true });
      } else {
        // enforce free plan constraints
        const days = Number(this.form.get('planDays')!.value) || 0;
        this.form.patchValue({
          planDays: Math.min(days, 3),
          enableNutritionAnalysis: false,
          planFocus: 'ausgewogen',
          gourmetMode: false,
        });
      }
    }
  }

  onPlanDaysChange(): void {
    const days = Number(this.form.get('planDays')!.value) || 0;
    if (!this.isProUser) {
      if (days > 3) this.form.get('planDays')!.setValue(3, { emitEvent: false });
      this.showPlanDaysHint = false;
    } else {
      this.showPlanDaysHint = days > 14;
      if (days > 14) this.form.get('planDays')!.setValue(14, { emitEvent: false });
    }
  }

  handleProFeatureClick(): void {
    if (!this.isProUser) this.showUpgradeModal.emit();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitPlan.emit(this.form.getRawValue() as PlannerOptions);
  }

  get currentUserLabel(): string | null {
    const u = this.auth.currentUser;
    return u?.name ?? u?.email ?? null;
  }

  // Helper for strict template typing with dynamic form control paths
  control(path: string): FormControl {
    return this.form.get(path) as FormControl;
  }
}

