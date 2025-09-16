import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
  FormControl,
  FormGroup,
} from '@angular/forms';
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

type MealsGroup = {
  breakfast: FormControl<boolean>;
  lunch: FormControl<boolean>;
  dinner: FormControl<boolean>;
  snack: FormControl<boolean>;
  dessert: FormControl<boolean>;
};

type PlannerForm = FormGroup<{
  diet: FormControl<string>;
  allergies: FormControl<string>;
  people: FormControl<number>;
  planDays: FormControl<number>;
  cookTime: FormControl<string>;
  calories: FormControl<number>;
  meals: FormGroup<MealsGroup>;
  enableNutritionAnalysis: FormControl<boolean>;
  planFocus: FormControl<string>;
  gourmetMode: FormControl<boolean>;
}>;
@Component({
  selector: 'app-meal-planner-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SvgInjectDirective],
  templateUrl: './meal-planner-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealPlannerFormComponent implements OnChanges {
  @Input() isLoading = false;
  @Input() isProUser = false;
  @Input() remainingRequests: number | null = null;
  @Output() submitPlan = new EventEmitter<PlannerOptions>();
  @Output() showUpgradeModal = new EventEmitter<void>();

  readonly icons = {
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
  } as const;

  readonly mealTypes = [
    'breakfast',
    'lunch',
    'dinner',
    'snack',
    'dessert',
  ] as const;
  readonly mealTypeTranslations: Record<string, string> = {
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
    dessert: 'Dessert',
  };

  form!: PlannerForm;

  showPlanDaysHint = false;

  constructor(private readonly fb: NonNullableFormBuilder, public readonly auth: AuthService) {
    this.form = this.fb.group({
      diet: this.fb.control<string>(''),
      allergies: this.fb.control<string>(''),
      people: this.fb.control<number>(2, {
        validators: [Validators.required, Validators.min(1), Validators.max(10)],
      }),
      planDays: this.fb.control<number>(7, {
        validators: [Validators.required, Validators.min(1), Validators.max(14)],
      }),
      cookTime: this.fb.control<string>('30 Minuten', {
        validators: [Validators.required],
      }),
      calories: this.fb.control<number>(2000, {
        validators: [Validators.min(0), Validators.max(10000)],
      }),
      meals: this.fb.group<MealsGroup>({
        breakfast: this.fb.control<boolean>(true),
        lunch: this.fb.control<boolean>(true),
        dinner: this.fb.control<boolean>(true),
        snack: this.fb.control<boolean>(false),
        dessert: this.fb.control<boolean>(false),
      }),
      enableNutritionAnalysis: this.fb.control<boolean>({ value: false, disabled: !this.isProUser } as any),
      planFocus: this.fb.control<string>({ value: 'ausgewogen', disabled: !this.isProUser } as any, {
        validators: [Validators.required],
        nonNullable: true,
      } as any),
      gourmetMode: this.fb.control<boolean>({ value: false, disabled: !this.isProUser } as any),
    }) as PlannerForm;

    this.form.controls.planDays.valueChanges.subscribe(() => this.onPlanDaysChange());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isProUser']) {
      if (this.isProUser) {
        this.form.patchValue({ enableNutritionAnalysis: true });
        this.setProControlsDisabled(false);
      } else {
        // enforce free plan constraints
        const days = Number(this.form.get('planDays')!.value) || 0;
        this.form.patchValue({
          planDays: Math.min(days, 3),
          enableNutritionAnalysis: false,
          planFocus: 'ausgewogen',
          gourmetMode: false,
        });
        this.setProControlsDisabled(true);
      }
    }
  }

  onPlanDaysChange(): void {
    const days = this.form.controls.planDays.value || 0;
    if (!this.isProUser) {
      if (days > 3)
        this.form.controls.planDays.setValue(3, { emitEvent: false });
      this.showPlanDaysHint = false;
    } else {
      this.showPlanDaysHint = days > 14;
      if (days > 14)
        this.form.controls.planDays.setValue(14, { emitEvent: false });
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
    this.submitPlan.emit(this.form.getRawValue() as unknown as PlannerOptions);
  }

  get currentUserLabel(): string | null {
    const u = this.auth.currentUser;
    return u?.name ?? u?.email ?? null;
  }

  // Helper for strict template typing with dynamic form control paths
  // Overload to support dot-paths in template (e.g. 'meals.breakfast') and typed top-level keys
  control(path: string): any;
  control<K extends keyof PlannerForm['controls']>(key: K): PlannerForm['controls'][K];
  control(arg: string | keyof PlannerForm['controls']): any {
    if (typeof arg === 'string') return this.form.get(arg) as any;
    return this.form.controls[arg as keyof PlannerForm['controls']];
  }

  private setProControlsDisabled(disabled: boolean): void {
    const names: Array<string> = [
      'enableNutritionAnalysis',
      'planFocus',
      'gourmetMode',
    ];
    for (const n of names) {
      const c = this.form.get(n);
      if (!c) continue;
      if (disabled) c.disable({ emitEvent: false });
      else c.enable({ emitEvent: false });
    }
  }
}
