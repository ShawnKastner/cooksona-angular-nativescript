import { Component, NO_ERRORS_SCHEMA, OnInit, inject } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { HealthStore } from './health.store';
import { DayHeaderComponent } from './day-header/day-header.component';
import { CalorieProgressComponent } from './calorie-progress/calorie-progress.component';
import { MacronutrientsComponent } from './macronutrients/macronutrients.component';
import { WaterProgressComponent } from './water-progress/water-progress.component';
import { TrackingActionsComponent } from './tracking-actions/tracking-actions.component';

@Component({
  selector: 'ns-health-page',
  standalone: true,
  templateUrl: './health-page.component.html',
  imports: [
    NativeScriptCommonModule,
    DayHeaderComponent,
    CalorieProgressComponent,
    MacronutrientsComponent,
    WaterProgressComponent,
    TrackingActionsComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HealthPageComponent implements OnInit {
  private readonly store = inject(HealthStore);

  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly metrics = this.store.metricsForSelectedDate;

  protected readonly requiresOnboarding = this.store.requiresOnboarding;

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }
}
