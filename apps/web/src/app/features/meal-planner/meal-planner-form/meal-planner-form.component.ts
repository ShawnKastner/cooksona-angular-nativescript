import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
  FormControl,
  FormGroup,
  AbstractControl,
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
} from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { LoadingSpinnerSmallComponent } from '../../../shared/ui/loading-spinner/loading-spinner-small.component';

type MealsGroup = {
  breakfast: FormControl<boolean>;
  lunch: FormControl<boolean>;
  dinner: FormControl<boolean>;
  snack: FormControl<boolean>;
  dessert: FormControl<boolean>;
};

type CookTimeOption = '15 Minuten' | '30 Minuten' | '45 Minuten' | '1 Stunde';
type PlanFocusOption =
  | 'ausgewogen'
  | 'proteinreich'
  | 'kohlenhydratarm'
  | 'fettarm';

type PlannerForm = FormGroup<{
  diet: FormControl<string>;
  allergies: FormControl<string>;
  people: FormControl<number>;
  planDays: FormControl<number>;
  cookTime: FormControl<CookTimeOption>;
  calories: FormControl<number>;
  meals: FormGroup<MealsGroup>;
  enableNutritionAnalysis: FormControl<boolean>;
  planFocus: FormControl<PlanFocusOption>;
  gourmetMode: FormControl<boolean>;
}>;

type PlannerFormValue = {
  diet: string;
  allergies: string;
  people: number;
  planDays: number;
  cookTime: CookTimeOption;
  calories: number;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snack: boolean;
    dessert: boolean;
  };
  enableNutritionAnalysis: boolean;
  planFocus: PlanFocusOption;
  gourmetMode: boolean;
};
@Component({
  selector: 'app-meal-planner-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SvgInjectDirective,
    LoadingSpinnerSmallComponent,
  ],
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

  showPlanDaysHint = signal(false);

  constructor(
    private readonly fb: NonNullableFormBuilder,
    public readonly auth: AuthService,
  ) {
    this.form = this.fb.group({
      diet: this.fb.control<string>(''),
      allergies: this.fb.control<string>(''),
      people: this.fb.control<number>(2, {
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.max(10),
        ],
      }),
      planDays: this.fb.control<number>(7, {
        validators: [Validators.required, Validators.min(1), Validators.max(7)],
      }),
      cookTime: this.fb.control<CookTimeOption>('30 Minuten', {
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
      enableNutritionAnalysis: this.fb.control<boolean>(false),
      planFocus: this.fb.control<PlanFocusOption>(
        'ausgewogen',
        Validators.required,
      ),
      gourmetMode: this.fb.control<boolean>(false),
    }) as PlannerForm;

    this.form.controls.planDays.valueChanges.subscribe(() =>
      this.onPlanDaysChange(),
    );

    // Ensure disabled/enabled states are consistent and validity is up-to-date
    this.setProControlsDisabled(!this.isProUser);
    // Clamp initial planDays for free users so HTML max validator doesn't invalidate the form
    if (!this.isProUser) {
      const daysInit = Number(this.form.controls.planDays.value) || 0;
      if (daysInit > 3)
        this.form.controls.planDays.setValue(3, { emitEvent: false });
    }
    this.form.updateValueAndValidity({ emitEvent: false });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isProUser']) {
      if (this.isProUser) {
        this.form.patchValue({ enableNutritionAnalysis: true });
        this.setProControlsDisabled(false);
      } else {
        // enforce free plan constraints
        const days = this.form.controls.planDays.value;
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
      this.showPlanDaysHint.set(false);
    } else {
      this.showPlanDaysHint.set(days > 7);
      if (days > 7)
        this.form.controls.planDays.setValue(7, { emitEvent: false });
    }
  }

  handleProFeatureClick(): void {
    if (!this.isProUser) this.showUpgradeModal.emit();
  }

  submit(): void {
    // Recompute validity in case external changes affected controls
    this.form.updateValueAndValidity({ onlySelf: false });
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value: PlannerFormValue = this.form.getRawValue();
    const { calories, ...rest } = value;
    const payload: PlannerOptions = {
      ...rest,
      calories: Number.isFinite(calories) ? calories : undefined,
    };
    this.submitPlan.emit(payload);
  }

  get currentUserLabel(): string | null {
    const u = this.auth.currentUser;
    return u?.name ?? u?.email ?? null;
  }

  // Helper for strict template typing with dynamic form control paths
  // Overload to support dot-paths in template (e.g. 'meals.breakfast') and typed top-level keys
  control(path: string): AbstractControl | null;
  control<K extends keyof PlannerForm['controls']>(
    key: K,
  ): PlannerForm['controls'][K];
  control(
    arg: string | keyof PlannerForm['controls'],
  ):
    | AbstractControl
    | PlannerForm['controls'][keyof PlannerForm['controls']]
    | null {
    if (typeof arg === 'string') return this.form.get(arg);
    return this.form.controls[arg];
  }

  private setProControlsDisabled(disabled: boolean): void {
    const names: Array<keyof PlannerFormValue> = [
      'enableNutritionAnalysis',
      'planFocus',
      'gourmetMode',
    ];
    for (const n of names) {
      const control = this.control(n);
      if (!control) continue;
      if (disabled) {
        control.disable({ emitEvent: false });
      } else {
        control.enable({ emitEvent: false });
      }
    }
  }
}
