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
import { ActivityType } from '@cooksona/models';
import { ACTIVITY_OPTIONS } from '@cooksona/constants/activities';
import { ArrowLeft } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

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
export class TrackActivityComponent implements OnInit {
  activityOptions = ACTIVITY_OPTIONS;
  selectedActivityType: ActivityType | null = null;
  activityForm!: FormGroup;

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
  }

  selectActivity(activityType: ActivityType): void {
    this.selectedActivityType = activityType;
  }

  saveActivity(): void {}

  goBack(): void {
    this.routerExtensions.back();
  }

  /*   getActivityLabel(type: ActivityType): string {
    return this.activityOptions.find((opt) => opt.type === type)?.label || type;
  } */

  get durationMinutes(): number {
    return this.activityForm.get('durationMinutes')?.value || 0;
  }

  get caloriesBurned(): number {
    return this.activityForm.get('caloriesBurned')?.value || 0;
  }
}
