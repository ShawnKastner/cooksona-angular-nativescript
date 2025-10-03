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
import { ActivityType, getDateString } from '@cooksona/models';
import { ACTIVITY_OPTIONS } from '@cooksona/constants/activities';
import { ArrowLeft } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { HealthStore } from '../health.store';
import { alert } from '@nativescript/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ns-track-activity',
  templateUrl: './track-activity.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
    SvgToDataUriPipe,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TrackActivityComponent implements OnInit, OnDestroy {
  private readonly healthStore = inject(HealthStore);

  activityOptions = ACTIVITY_OPTIONS;
  selectedActivityType: ActivityType | null = null;
  activityForm!: FormGroup;
  isSaving = signal(false);

  // Signals for form values to avoid change detection errors
  durationMinutes = signal(0);
  caloriesBurned = signal(0);
  formValid = signal(false); // Track form validity

  private formSubscription?: Subscription;
  private statusSubscription?: Subscription;

  icons = {
    ArrowLeft,
  };

  constructor(
    private fb: FormBuilder,
    private routerExtensions: RouterExtensions,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.activityForm = this.fb.group({
      durationMinutes: [null, [Validators.required, Validators.min(1)]],
      caloriesBurned: [null, [Validators.required, Validators.min(1)]],
    });

    // Subscribe to form changes and update signals
    this.formSubscription = this.activityForm.valueChanges.subscribe(
      (value) => {
        this.durationMinutes.set(value.durationMinutes || 0);
        this.caloriesBurned.set(value.caloriesBurned || 0);
      },
    );

    // Subscribe to form status changes
    this.statusSubscription = this.activityForm.statusChanges.subscribe(() => {
      this.formValid.set(this.activityForm.valid);
    });

    // Also update on value changes for immediate feedback
    this.activityForm.valueChanges.subscribe(() => {
      this.formValid.set(this.activityForm.valid);
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.statusSubscription?.unsubscribe();
  }

  selectActivity(activityType: ActivityType): void {
    this.selectedActivityType = activityType;
  }

  async saveActivity(): Promise<void> {
    if (
      !this.selectedActivityType ||
      !this.activityForm.valid ||
      this.isSaving()
    ) {
      return;
    }

    this.isSaving.set(true);

    try {
      await this.healthStore.trackActivity({
        activityType: this.selectedActivityType,
        durationMinutes: parseInt(this.activityForm.value.durationMinutes, 10),
        caloriesBurned: parseInt(this.activityForm.value.caloriesBurned, 10),
        date: getDateString(this.healthStore.selectedDate()), // Use selected date from store
      });

      // Navigate back on success
      this.routerExtensions.back();
    } catch (error) {
      console.error('Error saving activity:', error);
      alert({
        title: 'Fehler',
        message:
          'Aktivität konnte nicht gespeichert werden. Bitte versuche es erneut.',
        okButtonText: 'OK',
      });
    } finally {
      this.isSaving.set(false);
    }
  }

  goBack(): void {
    this.routerExtensions.back();
  }

  getActivityLabel(type: ActivityType): string {
    return this.activityOptions.find((opt) => opt.type === type)?.label || type;
  }
}
