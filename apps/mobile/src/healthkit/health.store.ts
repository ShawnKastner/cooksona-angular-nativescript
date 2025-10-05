import { Injectable, Signal, computed, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ActivitySummary, Workout } from './health-domain.models';

export const DEFAULT_STEP_GOAL = 8000;

interface SummaryMetrics {
  dateISO: string;
  steps: number;
  distanceKm: number;
  activeKcal: number;
}

@Injectable()
export class HealthStore {
  private readonly goalSignal = signal<number>(DEFAULT_STEP_GOAL);
  private readonly summarySubject = new BehaviorSubject<ActivitySummary | null>(null);
  private readonly workoutsSubject = new BehaviorSubject<Workout[]>([]);
  private readonly errorsSubject = new BehaviorSubject<string | null>(null);

  private lastMetrics: SummaryMetrics | null = null;

  readonly goal: Signal<number> = computed(() => this.goalSignal());
  readonly summary$: Observable<ActivitySummary | null> = this.summarySubject.asObservable();
  readonly workouts$: Observable<Workout[]> = this.workoutsSubject.asObservable();
  readonly errors$: Observable<string | null> = this.errorsSubject.asObservable();

  get goalSnapshot(): number {
    return this.goalSignal();
  }

  setGoal(goal: number): void {
    const normalized = Number.isFinite(goal) && goal > 0 ? Math.round(goal) : DEFAULT_STEP_GOAL;
    this.goalSignal.set(normalized);
    this.republishSummary();
  }

  setSummary(metrics: SummaryMetrics): void {
    this.lastMetrics = metrics;
    this.republishSummary();
  }

  setWorkouts(workouts: Workout[]): void {
    this.workoutsSubject.next(workouts);
  }

  setError(message: string | null): void {
    this.errorsSubject.next(message);
  }

  clearError(): void {
    this.errorsSubject.next(null);
  }

  private republishSummary(): void {
    if (!this.lastMetrics) {
      this.summarySubject.next(null);
      return;
    }

    const goal = this.goalSignal();
    const steps = this.lastMetrics.steps;
    const progress = goal > 0 ? Math.min(1, Math.max(0, steps / goal)) : 0;

    const summary: ActivitySummary = {
      dateISO: this.lastMetrics.dateISO,
      steps,
      distanceKm: this.lastMetrics.distanceKm,
      activeKcal: this.lastMetrics.activeKcal,
      goalSteps: goal,
      progress01: progress,
    };

    this.summarySubject.next(summary);
  }
}
