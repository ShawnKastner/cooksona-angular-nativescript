import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  signal,
} from '@angular/core';
import {
  ModalDialogParams,
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import {
  CalendarDays,
  Leaf,
  ShieldBan,
  Sparkles,
  Users,
  X,
} from '@cooksona/constants/icons';
import { PlanApiService } from '@cooksona/api';
import { PlannerOptions } from '@cooksona/models';
import { PlannerStore } from '../planner.store';

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'dessert';

@Component({
  selector: 'ns-meal-plan-form',
  templateUrl: './meal-plan-form.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
    SvgToDataUriPipe,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  styles: [
    `
      Switch {
        background-color: #4a6c6f;
        off-background-color: #9ca3af;
      }
    `,
  ],
})
export class MealPlanFormComponent implements AfterViewInit {
  private readonly planApi = inject(PlanApiService);
  private readonly store = inject(PlannerStore);

  icons = {
    X,
    Leaf,
    ShieldBan,
    Users,
    CalendarDays,
    Sparkles,
  } as const;

  form!: FormGroup;

  mealTypeTranslations = signal<Record<MealType, string>>({
    breakfast: 'Frühstück',
    lunch: 'Mittagessen',
    dinner: 'Abendessen',
    snack: 'Snack',
    dessert: 'Dessert',
  });

  private readonly Focus = undefined as unknown as NonNullable<
    PlannerOptions['planFocus']
  >;
  focusOptions = signal<NonNullable<PlannerOptions['planFocus']>[]>([
    'ausgewogen',
    'proteinreich',
    'kohlenhydratarm',
  ]);

  constructor(
    private params: ModalDialogParams,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      diet: [''],
      allergies: [''],
      people: [2],
      planDays: [7],
      cookTime: ['30 Minuten'],
      meals: this.fb.group({
        breakfast: [true],
        lunch: [true],
        dinner: [true],
        snack: [false],
        dessert: [false],
      }),
      planFocusIndex: [0],
    });
  }

  get mealKeys(): MealType[] {
    return Object.keys(this.mealTypeTranslations()) as MealType[];
  }

  clampNumber(value: number, min: number, max: number): number {
    if (isNaN(value as any)) return min;
    return Math.max(min, Math.min(max, value));
  }

  onPeopleBlur() {
    const v = this.form.value;
    const clamped = this.clampNumber(Number(v.people ?? 0), 1, 10);
    if (clamped !== v.people) this.form.patchValue({ people: clamped });
  }

  onPlanDaysBlur() {
    const v = this.form.value;
    const clamped = this.clampNumber(Number(v.planDays ?? 0), 1, 7);
    if (clamped !== v.planDays) this.form.patchValue({ planDays: clamped });
  }

  async handleSubmit() {
    this.onPeopleBlur();
    this.onPlanDaysBlur();
    const v = this.form.value as any;
    const result: PlannerOptions = {
      diet: v.diet ?? '',
      allergies: v.allergies ?? '',
      people: Number(v.people ?? 1),
      planDays: Number(v.planDays ?? 7),
      cookTime: v.cookTime ?? '30 Minuten',
      meals: v.meals ?? {},
      planFocus: (this.focusOptions()[v.planFocusIndex ?? 0] ??
        this.focusOptions()[0]) as NonNullable<PlannerOptions['planFocus']>,
    };
    this.params.closeCallback(result);
  }

  close() {
    this.params.closeCallback();
  }

  ngAfterViewInit(): void {
    // Stabilize initial bindings to avoid ExpressionChanged after modal instantiation
    this.cdr.detectChanges();
  }
}
