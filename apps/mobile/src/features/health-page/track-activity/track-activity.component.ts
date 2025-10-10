import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  inject,
  signal,
  OnDestroy,
  computed,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterExtensions } from '@nativescript/angular';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import {
  ActivityType,
  calculateCaloriesBurned,
  getDateString,
} from '@cooksona/models';
import {
  ACTIVITY_OPTIONS,
  ACTIVITY_CATEGORIES,
  ActivityCategory,
} from '@cooksona/constants/activities';
import { ArrowLeft } from '@cooksona/constants/icons';
import { HealthStore } from '@cooksona/health';
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
  ],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TrackActivityComponent implements OnInit, OnDestroy {
  private readonly healthStore = inject(HealthStore);

  activityOptions = ACTIVITY_OPTIONS;
  activityCategories = ACTIVITY_CATEGORIES;
  filteredCategories = signal<ActivityCategory[]>(ACTIVITY_CATEGORIES);

  selectedActivityType: ActivityType | null = null;
  activityForm!: FormGroup;
  isSaving = signal(false);

  // UI State - Step-based flow
  showActivitySelection = signal(true); // true = Schritt 1, false = Schritt 2

  // Search and UI state
  searchQuery = signal('');
  expandedCategories = signal<Set<string>>(new Set(['Beliebt'])); // 'Beliebt' ist standardmäßig ausgeklappt

  // Signals for form values to avoid change detection errors
  durationMinutes = signal(0);

  // Computed signal für automatische Kalorienberechnung
  caloriesBurned = computed(() => {
    const duration = this.durationMinutes();
    const userWeight = this.healthStore.healthData()?.userProfile?.weight || 70; // Default 70kg falls kein Gewicht

    if (!this.selectedActivityType || duration <= 0) {
      return 0;
    }

    return calculateCaloriesBurned(
      this.selectedActivityType,
      duration,
      userWeight,
    );
  });

  formValid = signal(false); // Track form validity

  private formSubscription?: Subscription;
  private statusSubscription?: Subscription;

  icons = {
    ArrowLeft,
  };

  constructor(
    private fb: FormBuilder,
    private routerExtensions: RouterExtensions,
  ) {}

  ngOnInit(): void {
    // Nur noch Dauer im Formular - Kalorien werden automatisch berechnet
    this.activityForm = this.fb.group({
      durationMinutes: [null, [Validators.required, Validators.min(1)]],
    });

    // Subscribe to form changes and update signals
    this.formSubscription = this.activityForm.valueChanges.subscribe(
      (value) => {
        this.durationMinutes.set(value.durationMinutes || 0);
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
    // Nach Auswahl zum nächsten Schritt wechseln
    this.showActivitySelection.set(false);
  }

  backToActivitySelection(): void {
    this.showActivitySelection.set(true);
  }

  onSearchChange(value: string): void {
    const query = value.toLowerCase().trim();
    this.searchQuery.set(query);

    if (!query) {
      // Wenn keine Suche, zeige alle Kategorien
      this.filteredCategories.set(this.activityCategories);
      return;
    }

    // Filtere Kategorien und Aktivitäten basierend auf der Suche
    const filtered = this.activityCategories
      .map((category) => ({
        ...category,
        activities: category.activities.filter((activity) =>
          activity.label.toLowerCase().includes(query),
        ),
      }))
      .filter((category) => category.activities.length > 0);

    this.filteredCategories.set(filtered);

    // Erweitere automatisch alle Kategorien bei Suche
    if (query) {
      const allCategoryNames = filtered.map((c) => c.category);
      this.expandedCategories.set(new Set(allCategoryNames));
    }
  }

  toggleCategory(categoryName: string): void {
    const expanded = new Set(this.expandedCategories());
    if (expanded.has(categoryName)) {
      expanded.delete(categoryName);
    } else {
      expanded.add(categoryName);
    }
    this.expandedCategories.set(expanded);
  }

  isCategoryExpanded(categoryName: string): boolean {
    return this.expandedCategories().has(categoryName);
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
        caloriesBurned: this.caloriesBurned(), // Verwende die berechneten Kalorien
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
