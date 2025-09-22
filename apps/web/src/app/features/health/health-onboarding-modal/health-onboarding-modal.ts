import { Component, input, output, signal } from '@angular/core';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { icons } from '@cooksona/constants/icons';
import type { UserProfile } from '@cooksona/models/health.models';

@Component({
  selector: 'app-health-onboarding-modal',
  standalone: true,
  imports: [SvgInjectDirective],
  templateUrl: './health-onboarding-modal.html',
})
export class HealthOnboardingModalComponent {
  protected readonly icons = icons;

  isOpen = input<boolean>(false);
  existingProfile = input<UserProfile | undefined>(undefined);
  close = output<void>();
  complete = output<UserProfile>();

  step = signal(1);
  profile = signal<UserProfile>({
    gender: 'female',
    age: 30,
    height: 170,
    weight: 65,
    activityLevel: 'light',
    goal: 'maintain',
  });

  // Expose Math for potential future template use
  protected Math = Math;

  // Template event helpers
  onGenderChange(event: Event) {
    const value = (event.target as HTMLSelectElement)
      .value as UserProfile['gender'];
    const p = this.profile();
    this.profile.set({ ...p, gender: value });
  }

  onAgeInput(event: Event) {
    const value = Number((event.target as HTMLInputElement).value || 0);
    const p = this.profile();
    this.profile.set({ ...p, age: value });
  }

  onHeightInput(event: Event) {
    const value = Number((event.target as HTMLInputElement).value || 0);
    const p = this.profile();
    this.profile.set({ ...p, height: value });
  }

  onWeightInput(event: Event) {
    const value = Number((event.target as HTMLInputElement).value || 0);
    const p = this.profile();
    this.profile.set({ ...p, weight: value });
  }

  setActivity(level: UserProfile['activityLevel']) {
    const p = this.profile();
    this.profile.set({ ...p, activityLevel: level });
  }

  setGoal(goal: UserProfile['goal']) {
    const p = this.profile();
    this.profile.set({ ...p, goal });
  }
}
