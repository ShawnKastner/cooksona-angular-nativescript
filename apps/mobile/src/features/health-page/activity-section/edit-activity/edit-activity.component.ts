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
import { ActivityType } from '@cooksona/models';
import { ACTIVITY_OPTIONS } from '@cooksona/constants/activities';
import { ArrowLeft } from '@cooksona/constants/icons';
import { HealthStore } from '../../health.store';
import { alert } from '@nativescript/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'ns-edit-activity',
  templateUrl: './edit-activity.component.html',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    NativeScriptFormsModule,
    ReactiveFormsModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class EditActivityComponent implements OnInit, OnDestroy {
  private readonly healthStore = inject(HealthStore);
  private readonly route = inject(ActivatedRoute);
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly fb = inject(FormBuilder);

  activityOptions = ACTIVITY_OPTIONS;
  selectedActivityType: ActivityType | null = null;
  activityForm!: FormGroup;
  isSaving = signal(false);

  // Activity ID for editing
  private activityId: string = '';

  // Signals for form values
  durationMinutes = signal(0);
  caloriesBurned = signal(0);
  formValid = signal(false);

  private formSubscription?: Subscription;
  private statusSubscription?: Subscription;

  icons = {
    ArrowLeft,
  };

  ngOnInit(): void {
    // Get activity data from query params
    this.route.queryParams.subscribe((params) => {
      this.activityId = params['id'] || '';
      this.selectedActivityType =
        (params['activityType'] as ActivityType) || null;

      const durationMinutes = parseInt(params['durationMinutes'], 10) || 0;
      const caloriesBurned = parseInt(params['caloriesBurned'], 10) || 0;

      // Initialize form with existing values
      this.activityForm = this.fb.group({
        durationMinutes: [
          durationMinutes,
          [Validators.required, Validators.min(1)],
        ],
        caloriesBurned: [
          caloriesBurned,
          [Validators.required, Validators.min(1)],
        ],
      });

      // Set initial signals
      this.durationMinutes.set(durationMinutes);
      this.caloriesBurned.set(caloriesBurned);
      this.formValid.set(this.activityForm.valid);

      // Subscribe to form changes
      this.formSubscription = this.activityForm.valueChanges.subscribe(
        (value) => {
          this.durationMinutes.set(value.durationMinutes || 0);
          this.caloriesBurned.set(value.caloriesBurned || 0);
        },
      );

      // Subscribe to form status changes
      this.statusSubscription = this.activityForm.statusChanges.subscribe(
        () => {
          this.formValid.set(this.activityForm.valid);
        },
      );

      this.activityForm.valueChanges.subscribe(() => {
        this.formValid.set(this.activityForm.valid);
      });
    });
  }

  ngOnDestroy(): void {
    this.formSubscription?.unsubscribe();
    this.statusSubscription?.unsubscribe();
  }

  selectActivity(activityType: ActivityType): void {
    this.selectedActivityType = activityType;
  }

  async updateActivity(): Promise<void> {
    if (
      !this.selectedActivityType ||
      !this.activityForm.valid ||
      this.isSaving() ||
      !this.activityId
    ) {
      return;
    }

    this.isSaving.set(true);

    try {
      await this.healthStore.updateActivity(this.activityId, {
        activityType: this.selectedActivityType,
        durationMinutes: parseInt(this.activityForm.value.durationMinutes, 10),
        caloriesBurned: parseInt(this.activityForm.value.caloriesBurned, 10),
      });

      // Navigate back on success
      this.routerExtensions.back();
    } catch (error) {
      console.error('Error updating activity:', error);
      alert({
        title: 'Fehler',
        message:
          'Aktivität konnte nicht aktualisiert werden. Bitte versuche es erneut.',
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
