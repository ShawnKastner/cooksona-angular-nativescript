import {
  Component,
  inject,
  NO_ERRORS_SCHEMA,
  signal,
  OnInit,
  input,
  computed,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Dumbbell } from '@cooksona/constants/icons';
import { isIOS, ApplicationSettings } from '@nativescript/core';
import { HealthStore } from '@cooksona/health';

@Component({
  selector: 'ns-steps-card',
  templateUrl: './steps-card.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class StepsCardComponent implements OnInit {
  private readonly store = inject(HealthStore);
  readonly loading = this.store.loading;

  protected readonly isIOS = isIOS;
  protected readonly Math = Math;
  protected readonly icons = {
    Dumbbell,
  } as const;

  stepGoal = input<number>(10000); // Default 10,000 steps

  protected isConnected = signal<boolean>(false);

  // Get metrics from store (these come from backend)
  protected readonly metrics = this.store.metricsForSelectedDate;

  // Computed values from metrics
  protected readonly steps = computed<number>(() => {
    return this.metrics()?.steps || 0;
  });

  protected readonly kilometers = computed<number>(() => {
    return this.metrics()?.stepsKilometers || 0;
  });

  protected readonly calories = computed<number>(() => {
    return this.metrics()?.stepsCalories || 0;
  });

  async ngOnInit() {
    // Check if health is connected
    this.isConnected.set(
      ApplicationSettings.getBoolean('healthkit_connected', false),
    );
  }

  protected get progressPercentage(): number {
    return Math.min((this.steps() / this.stepGoal()) * 100, 100);
  }

  protected formatNumber(num: number): string {
    return num.toLocaleString('de-DE');
  }
}
