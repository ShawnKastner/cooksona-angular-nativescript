import { Component, computed, input, output } from '@angular/core';
import { ProgressRingComponent } from '../../../shared/ui/progress-ring/progress-ring.component';
import type { DailyMetrics, HealthData } from '@cooksona/models/health.models';

@Component({
  selector: 'app-health-dashboard',
  templateUrl: './health-dashboard.component.html',
  standalone: true,
  imports: [ProgressRingComponent],
})
export class HealthDashboardComponent {
  // Inputs from parent (page orchestrates API + date selection)
  healthData = input.required<HealthData>();
  metrics = input.required<DailyMetrics>();

  // Outputs to parent (open modals)
  updateProfile = output<void>();
  openManualEntry = output<void>();

  protected calorieGoal = computed(() => {
    const data = this.healthData();
    if (data.calorieTarget) return data.calorieTarget;
    if (data.maintenanceCalories) return data.maintenanceCalories;
    return data.basalMetabolicRate ?? 0;
  });

  protected totalCaloriesWithActivity = computed(() => {
    return Math.max(
      0,
      Math.round(this.calorieGoal() + this.metrics().caloriesBurned),
    );
  });

  protected remainingCalories = computed(() => {
    return Math.round(
      this.totalCaloriesWithActivity() - this.metrics().caloriesEaten,
    );
  });

  // Macro goals prefer backend targets, fallback to standard distribution
  protected proteinGoal = computed(() => {
    const macros = this.healthData().macroTargets;
    if (macros?.protein) return macros.protein;
    const goal = this.calorieGoal();
    return goal ? Math.round((goal * 0.3) / 4) : 0;
  });
  protected carbsGoal = computed(() => {
    const macros = this.healthData().macroTargets;
    if (macros?.carbs) return macros.carbs;
    const goal = this.calorieGoal();
    return goal ? Math.round((goal * 0.4) / 4) : 0;
  });
  protected fatGoal = computed(() => {
    const macros = this.healthData().macroTargets;
    if (macros?.fat) return macros.fat;
    const goal = this.calorieGoal();
    return goal ? Math.round((goal * 0.3) / 9) : 0;
  });

  // Progress percentages
  protected calorieProgress = computed(() => {
    const total = this.totalCaloriesWithActivity();
    return total > 0 ? (this.metrics().caloriesEaten / total) * 100 : 0;
  });
  protected proteinProgress = computed(() => {
    const goal = this.proteinGoal();
    return goal > 0 ? (this.metrics().protein / goal) * 100 : 0;
  });
  protected carbsProgress = computed(() => {
    const goal = this.carbsGoal();
    return goal > 0 ? (this.metrics().carbs / goal) * 100 : 0;
  });
  protected fatProgress = computed(() => {
    const goal = this.fatGoal();
    return goal > 0 ? (this.metrics().fat / goal) * 100 : 0;
  });

  // Expose Math for template use (e.g., Math.round in HTML bindings)
  protected Math = Math;
}
