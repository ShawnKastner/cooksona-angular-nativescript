import { Component, NO_ERRORS_SCHEMA, OnInit, inject } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { HealthStore } from './health.store';
import { DayHeaderComponent } from './day-header/day-header.component';
import { CalorieProgressComponent } from './calorie-progress/calorie-progress.component';
import { MacronutrientsComponent } from './macronutrients/macronutrients.component';
import { WaterProgressComponent } from './water-progress/water-progress.component';
import { TrackingActionsComponent } from './tracking-actions/tracking-actions.component';
import { MealSectionComponent } from './meal-section/meal-section.component';
import { ActivitySectionComponent } from './activity-section/activity-section.component';

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
    MealSectionComponent,
    ActivitySectionComponent,
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HealthPageComponent implements OnInit {
  private readonly store = inject(HealthStore);
  private readonly routerExtensions = inject(RouterExtensions);

  protected readonly loading = this.store.loading;
  protected readonly error = this.store.error;
  protected readonly metrics = this.store.metricsForSelectedDate;

  protected readonly requiresOnboarding = this.store.requiresOnboarding;

  async ngOnInit(): Promise<void> {
    await this.store.load();

    // Automatically navigate to onboarding if profile is not complete
    if (this.store.requiresOnboarding()) {
      this.startOnboarding();
    }
  }

  startOnboarding(): void {
    this.routerExtensions.navigate(['/home/health-onboarding'], {
      clearHistory: false,
      animated: true,
    });
  }
}
