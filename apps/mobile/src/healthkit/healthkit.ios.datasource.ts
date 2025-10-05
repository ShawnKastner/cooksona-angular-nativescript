import { Injectable } from '@angular/core';
import { mapWorkoutType } from './__mappers__/workout-type.map';
import { Workout, WorkoutSource } from './health-domain.models';
import { DateRange } from './health-data.plugin.datasource';

@Injectable()
export class HealthKitIosDataSource {
  private readonly store = HKHealthStore.new();

  isAvailable(): boolean {
    return HKHealthStore.isHealthDataAvailable();
  }

  requestAuthorization(): Promise<void> {
    const readItems = NSMutableArray.new();
    readItems.addObject(HKObjectType.workoutType());

    // Request workout routes as well so we can enrich workouts with GPS traces later.
    const routeType = HKObjectType.seriesTypeForIdentifier(HKWorkoutRouteTypeIdentifier);
    if (routeType) {
      readItems.addObject(routeType);
    }

    const readTypes = NSSet.setWithArray(readItems);

    return new Promise<void>((resolve, reject) => {
      this.store.requestAuthorizationToShareTypesReadTypesCompletion(
        null,
        readTypes,
        (success: boolean, error: NSError) => {
          if (!success) {
            const message = error?.localizedDescription ?? 'HealthKit Autorisierung fehlgeschlagen';
            reject(new Error(message));
            return;
          }
          resolve();
        },
      );
    });
  }

  fetchWorkouts(range: DateRange): Promise<Workout[]> {
    const predicate = HKQuery.predicateForSamplesWithStartDateEndDateOptions(
      range.start,
      range.end,
      HKQueryOptions.StrictStartDate,
    );

    const sortDescriptor = NSSortDescriptor.sortDescriptorWithKeyAscending('startDate', false);

    return new Promise<Workout[]>((resolve, reject) => {
      const query = HKSampleQuery.alloc().initWithSampleTypePredicateLimitSortDescriptorsResultsHandler(
        HKObjectType.workoutType(),
        predicate,
        HKObjectQueryNoLimit,
        NSArray.arrayWithObject(sortDescriptor),
        (_query, samples, error) => {
          if (error) {
            reject(new Error(error.localizedDescription));
            return;
          }

          const workouts: Workout[] = [];
          const count = samples?.count ?? 0;

          for (let index = 0; index < count; index += 1) {
            const sample = samples.objectAtIndex(index) as HKWorkout;
            workouts.push(this.mapWorkout(sample));
          }

          resolve(workouts);
        },
      );

      this.store.executeQuery(query);
    });
  }

  private mapWorkout(workout: HKWorkout): Workout {
    const type = workout.workoutActivityType;
    const meta = mapWorkoutType(type);
    const start = workout.startDate;
    const end = workout.endDate;
    const rawDuration = Number(workout.duration);
    const durationSec =
      rawDuration > 0 ? rawDuration : Math.max(0, (end.getTime() - start.getTime()) / 1000);

    const distanceQuantity = workout.totalDistance;
    const distanceKm = distanceQuantity
      ? Math.max(
          0,
          distanceQuantity.doubleValueForUnit(
            HKUnit.meterUnitWithMetricPrefix(HKMetricPrefix.Kilo),
          ),
        )
      : undefined;

    const energyQuantity = workout.totalEnergyBurned;
    const activeKcal = energyQuantity
      ? Math.max(0, energyQuantity.doubleValueForUnit(HKUnit.kilocalorieUnit()))
      : undefined;

    const bundleId =
      workout.sourceRevision?.source.bundleIdentifier ?? workout.source?.bundleIdentifier ?? '';
    const source: WorkoutSource = bundleId.startsWith('com.apple') ? 'apple_health' : 'other';

    return {
      id: workout.UUID.UUIDString,
      activityType: type,
      activityLabel: meta.label,
      start,
      end,
      durationSec,
      distanceKm: distanceKm ?? undefined,
      activeKcal: activeKcal ?? undefined,
      source,
    };
  }
}
