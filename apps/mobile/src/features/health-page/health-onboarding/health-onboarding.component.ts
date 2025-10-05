import {
  Component,
  NO_ERRORS_SCHEMA,
  signal,
  computed,
  inject,
  effect,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterExtensions } from '@nativescript/angular';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import { alert } from '@nativescript/core';
import { UserProfile } from '@cooksona/models';
import { HealthStore } from '../health.store';

interface ActivityLevelOption {
  value: UserProfile['activityLevel'];
  label: string;
  description: string;
}

interface GoalOption {
  value: UserProfile['goal'];
  label: string;
}

@Component({
  selector: 'ns-health-onboarding',
  templateUrl: './health-onboarding.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HealthOnboardingComponent {
  private readonly fb = inject(FormBuilder);
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly healthStore = inject(HealthStore);

  currentStep = signal(1);
  totalSteps = 3;
  isSaving = signal(false);
  formValid = signal(false); // Track form validity in a signal

  basicInfoForm: FormGroup;
  selectedActivityLevel = signal<UserProfile['activityLevel']>('light');
  selectedGoal = signal<UserProfile['goal']>('maintain');

  constructor() {
    // Initialize form in constructor to avoid undefined issues
    this.basicInfoForm = this.fb.group({
      gender: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(10), Validators.max(120)]],
      height: [
        '',
        [Validators.required, Validators.min(100), Validators.max(250)],
      ],
      weight: [
        '',
        [Validators.required, Validators.min(30), Validators.max(300)],
      ],
    });

    // Update formValid signal whenever form status changes
    this.basicInfoForm.statusChanges.subscribe(() => {
      this.formValid.set(this.basicInfoForm.valid);
    });

    // Also update on value changes (for immediate feedback)
    this.basicInfoForm.valueChanges.subscribe(() => {
      this.formValid.set(this.basicInfoForm.valid);
    });
  }

  activityLevels: ActivityLevelOption[] = [
    {
      value: 'sedentary',
      label: 'Sitzend',
      description: 'Wenig bis keine Bewegung, Bürojob.',
    },
    {
      value: 'light',
      label: 'Leicht aktiv',
      description: 'Leichte Bewegung/Sport an 1-3 Tagen/Woche.',
    },
    {
      value: 'moderate',
      label: 'Mäßig aktiv',
      description: 'Mäßige Bewegung/Sport an 3-5 Tagen/Woche.',
    },
    {
      value: 'active',
      label: 'Sehr aktiv',
      description: 'Harte Bewegung/Sport an 6-7 Tagen/Woche.',
    },
    {
      value: 'very_active',
      label: 'Extrem aktiv',
      description: 'Sehr harte Bewegung & körperlicher Job.',
    },
  ];

  goals: GoalOption[] = [
    { value: 'lose', label: 'Gewicht verlieren' },
    { value: 'maintain', label: 'Gewicht halten' },
    { value: 'gain', label: 'Muskeln aufbauen' },
  ];

  progressPercentage = computed(() => {
    return (this.currentStep() / this.totalSteps) * 100;
  });

  canGoNext = computed(() => {
    if (this.currentStep() === 1) {
      return this.formValid();
    }
    return true;
  });

  // Getter für FormControls (Type-Safety)
  get ageControl() {
    return this.basicInfoForm.get('age') as FormControl;
  }

  get heightControl() {
    return this.basicInfoForm.get('height') as FormControl;
  }

  get weightControl() {
    return this.basicInfoForm.get('weight') as FormControl;
  }

  nextStep(): void {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.set(this.currentStep() + 1);
    } else {
      this.complete();
    }
  }

  previousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  selectActivityLevel(level: UserProfile['activityLevel']): void {
    this.selectedActivityLevel.set(level);
  }

  selectGoal(goal: UserProfile['goal']): void {
    this.selectedGoal.set(goal);
  }

  async complete(): Promise<void> {
    if (!this.basicInfoForm.valid || this.isSaving()) {
      return;
    }

    const formValue = this.basicInfoForm.value;

    const profile: UserProfile = {
      gender: formValue.gender,
      age: parseInt(formValue.age, 10),
      height: parseFloat(formValue.height),
      weight: parseFloat(formValue.weight),
      activityLevel: this.selectedActivityLevel(),
      goal: this.selectedGoal(),
    };

    this.isSaving.set(true);

    try {
      await this.healthStore.saveProfile(profile);
      // Navigate to home after successful onboarding
      this.routerExtensions.navigate(['/home/health'], {
        clearHistory: true,
        animated: true,
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      alert({
        title: 'Fehler',
        message:
          'Profil konnte nicht gespeichert werden. Bitte versuche es erneut.',
        okButtonText: 'OK',
      });
    } finally {
      this.isSaving.set(false);
    }
  }
}
