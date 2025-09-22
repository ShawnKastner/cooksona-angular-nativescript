import { Component, computed, input, output } from '@angular/core';
import { ProgressRingComponent } from '../../../shared/ui/progress-ring/progress-ring.component';
import type {
  DailyMetrics,
  HealthData,
  UserProfile,
} from '@cooksona/models/health.models';

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

  private activityMultipliers: Record<UserProfile['activityLevel'], number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  private goalAdjustments: Record<UserProfile['goal'], number> = {
    lose: -300,
    maintain: 0,
    gain: 300,
  };

  // Calculations
  protected tdee = computed(() => {
    const data = this.healthData();
    const profile = data.userProfile;
    if (!profile) return 0;
    return data.bmr * (this.activityMultipliers[profile.activityLevel] ?? 1);
  });

  protected calorieGoal = computed(() => {
    const profile = this.healthData().userProfile;
    if (!profile) return 0;
    return this.tdee() + (this.goalAdjustments[profile.goal] ?? 0);
  });

  protected totalCaloriesWithActivity = computed(() => {
    return Math.max(
      0,
      Math.round(this.calorieGoal() + this.metrics().caloriesBurned)
    );
  });

  protected remainingCalories = computed(() => {
    return Math.round(
      this.totalCaloriesWithActivity() - this.metrics().caloriesEaten
    );
  });

  // Macro goals (C 40%, P 30%, F 30%)
  protected proteinGoal = computed(() =>
    Math.round((this.calorieGoal() * 0.3) / 4)
  );
  protected carbsGoal = computed(() =>
    Math.round((this.calorieGoal() * 0.4) / 4)
  );
  protected fatGoal = computed(() =>
    Math.round((this.calorieGoal() * 0.3) / 9)
  );

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
