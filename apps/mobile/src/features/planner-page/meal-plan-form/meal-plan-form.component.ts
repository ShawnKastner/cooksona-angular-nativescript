import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  NO_ERRORS_SCHEMA,
  signal,
  ViewChild,
} from '@angular/core';
import {
  ModalDialogParams,
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import {
  CalendarDays,
  ErrorCircle,
  Leaf,
  ShieldBan,
  Sparkles,
  Users,
  X,
} from '@cooksona/constants/icons';
import { PlannerOptions } from '@cooksona/models';
import { isIOS } from '@nativescript/core';
import { action } from '@nativescript/core/ui/dialogs';

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

      .input-row {
        border-bottom-width: 1px;
        border-bottom-color: #9ca3af;
        padding-bottom: 8px;
      }

      .input-row.input-invalid {
        border-bottom-color: #ef4444;
      }
    `,
  ],
})
export class MealPlanFormComponent implements AfterViewInit {
  icons = {
    X,
    Leaf,
    ShieldBan,
    Users,
    CalendarDays,
    Sparkles,
    ErrorCircle,
  } as const;
  isIOS = signal(isIOS);

  form!: FormGroup;
  @ViewChild('formScroll', { static: false }) formScroll: any;

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
      people: ['', Validators.required],
      planDays: ['', Validators.required],
      cookTime: ['30 Minuten', Validators.required],
      meals: this.fb.group({
        breakfast: [true],
        lunch: [true],
        dinner: [true],
        snack: [false],
        dessert: [false],
      }),
      nutritionAnalysis: [false],
      planFocusIndex: [0],
      gourmetMode: [false],
    });
  }

  get selectedPlanFocus(): string {
    const idx = this.form.get('planFocusIndex')?.value ?? 0;
    return this.focusOptions()[idx] ?? this.focusOptions()[0];
  }

  async choosePlanFocus() {
    const options = {
      title: 'Plan-Fokus',
      message: 'Bitte auswählen',
      cancelButtonText: 'Abbrechen',
      actions: this.focusOptions(),
    } as const;
    try {
      const result = (await action(options)) as string | undefined;
      if (!result) return;
      const idx = this.focusOptions().indexOf(result as any);
      if (idx >= 0) {
        this.form.get('planFocusIndex')?.setValue(idx);
        this.cdr.detectChanges();
      }
    } catch {
      // ignore dialog errors/cancel
    }
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
    if (!this.form.valid) {
      this.markAllTouched(this.form);

      await this.focusFirstInvalid();
      return;
    }

    this.onPeopleBlur();
    this.onPlanDaysBlur();
    const v = this.form.value as any;
    const result: PlannerOptions = {
      diet: v.diet ?? '',
      allergies: v.allergies ?? '',
      people: Number(v.people ?? 2),
      planDays: Number(v.planDays ?? 7),
      cookTime: v.cookTime ?? '30 Minuten',
      meals: v.meals ?? {},
      planFocus: (this.focusOptions()[v.planFocusIndex ?? 0] ??
        this.focusOptions()[0]) as NonNullable<PlannerOptions['planFocus']>,
    };
    this.params.closeCallback(result);
  }

  private markAllTouched(group: FormGroup) {
    Object.keys(group.controls).forEach((key) => {
      const control: any = group.get(key);
      if (control.controls) {
        // nested group
        this.markAllTouched(control as FormGroup);
      } else {
        control.markAsTouched();
      }
    });

    this.cdr.detectChanges();
  }

  private async focusFirstInvalid() {
    // order of preference
    const candidates = ['people', 'planDays'];
    for (const name of candidates) {
      const control = this.form.get(name);
      if (control && control.invalid) {
        try {
          const scroll: any = this.formScroll;
          if (scroll && scroll.nativeElement) {
            const view = scroll.nativeElement.getViewById(name) as any;
            if (view && typeof view.focus === 'function') {
              await new Promise((r) => setTimeout(r, 50));
              view.focus();
            }
          }
        } catch {
          // Ignore focus errors
        }
        return;
      }
    }
  }

  close() {
    this.params.closeCallback();
  }

  ngAfterViewInit(): void {
    // Stabilize initial bindings to avoid ExpressionChanged after modal instantiation
    this.cdr.detectChanges();
  }
}
