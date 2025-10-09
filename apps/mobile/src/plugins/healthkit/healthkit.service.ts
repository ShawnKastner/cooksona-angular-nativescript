import { Injectable } from '@angular/core';
import { isIOS } from '@nativescript/core';

export interface HealthKitWorkout {
  workoutActivityType: number;
  duration: number;
  totalEnergyBurned: number;
  startDate: Date;
  endDate: Date;
  uuid: string;
}

export interface StepsDetails {
  steps: number;
  kilometers: number;
  caloriesBurned: number;
}

@Injectable({ providedIn: 'root' })
export class HealthKitService {
  // @ts-expect-error - HKHealthStore is not available in TypeScript types
  private iosStore: HKHealthStore | null = null;

  constructor() {
    if (isIOS) {
      // @ts-expect-error - HKHealthStore is not available in TypeScript types
      this.iosStore = HKHealthStore.new();
    }
  }

  isAvailable(): boolean {
    if (!isIOS) return false;
    // @ts-expect-error - HKHealthStore is not available in TypeScript types
    return HKHealthStore.isHealthDataAvailable();
  }

  checkAuthorized(): boolean {
    if (!isIOS || !this.iosStore) return false;
    // @ts-expect-error - HKObjectType is not available in TypeScript types
    const stepsType = HKObjectType.quantityTypeForIdentifier(
      // @ts-expect-error - HKObjectType is not available in TypeScript types
      HKQuantityTypeIdentifierStepCount,
    );
    if (!stepsType) return false;
    const status = this.iosStore.authorizationStatusForType(stepsType);
    return Number(status) === 2;
  }

  async requestAuthorization(): Promise<void> {
    if (!isIOS || !this.iosStore) {
      throw new Error('Apple Health is only available on iOS devices.');
    }

    const readItems = NSMutableArray.new();
    // @ts-expect-error - HKObjectType is not available in TypeScript types
    readItems.addObject(HKObjectType.workoutType());
    // @ts-expect-error - HKObjectType is not available in TypeScript types
    const stepsType = HKObjectType.quantityTypeForIdentifier(
      // @ts-expect-error - HKQuantityTypeIdentifierStepCount is not available in TypeScript types
      HKQuantityTypeIdentifierStepCount,
    );
    if (stepsType) readItems.addObject(stepsType);
    // @ts-expect-error - HKObjectType is not available in TypeScript types
    const energyType = HKObjectType.quantityTypeForIdentifier(
      // @ts-expect-error - HKQuantityTypeIdentifierActiveEnergyBurned is not available in TypeScript types
      HKQuantityTypeIdentifierActiveEnergyBurned,
    );
    if (energyType) readItems.addObject(energyType);
    // @ts-expect-error - HKObjectType is not available in TypeScript types
    const routeType = HKObjectType.seriesTypeForIdentifier(
      // @ts-expect-error - HKWorkoutRouteTypeIdentifier is not available in TypeScript types
      HKWorkoutRouteTypeIdentifier,
    );
    if (routeType) readItems.addObject(routeType);
    const readTypes = NSSet.setWithArray(readItems);

    await new Promise<void>((resolve, reject) => {
      this.iosStore!.requestAuthorizationToShareTypesReadTypesCompletion(
        null,
        readTypes,
        (success: boolean, error: NSError) => {
          if (success) return resolve();
          reject(
            new Error(
              error
                ? String(error.localizedDescription)
                : 'Health authorization failed',
            ),
          );
        },
      );
    });
  }

  async disconnect(): Promise<void> {
    return;
  }

  async getTodaySteps(): Promise<number> {
    if (!isIOS || !this.iosStore) return 0;

    try {
      // @ts-expect-error - HKObjectType is not available in TypeScript types
      const stepsType = HKObjectType.quantityTypeForIdentifier(
        // @ts-expect-error - HKQuantityTypeIdentifierStepCount is not available in TypeScript types
        HKQuantityTypeIdentifierStepCount,
      );
      if (!stepsType) return 0;

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
      );

      // @ts-expect-error - HKQuery is not available in TypeScript types
      const predicate = HKQuery.predicateForSamplesWithStartDateEndDateOptions(
        startOfDay,
        endOfDay,
        // @ts-expect-error - HKQueryOptions is not available in TypeScript types
        HKQueryOptions.StrictStartDate,
      );

      return new Promise<number>((resolve) => {
        const query =
          // @ts-expect-error - HKStatisticsQuery is not available in TypeScript types
          HKStatisticsQuery.alloc().initWithQuantityTypeQuantitySamplePredicateOptionsCompletionHandler(
            stepsType,
            predicate,
            // @ts-expect-error - HKStatisticsOptions is not available in TypeScript types
            HKStatisticsOptions.CumulativeSum,
            (query: any, result: any, error: NSError) => {
              if (error) {
                console.error(
                  'Error fetching steps:',
                  error.localizedDescription,
                );
                return resolve(0);
              }
              if (!result) return resolve(0);

              const sum = result.sumQuantity();
              if (!sum) return resolve(0);
              // @ts-expect-error - HKUnit is not available in TypeScript types
              const unit = HKUnit.countUnit();
              const stepCount = sum.doubleValueForUnit(unit);
              resolve(Math.round(stepCount));
            },
          );
        this.iosStore!.executeQuery(query);
      });
    } catch (error) {
      console.error('Failed to fetch steps:', error);
      return 0;
    }
  }

  async getTodayWorkouts(): Promise<HealthKitWorkout[]> {
    if (!isIOS || !this.iosStore) {
      return [];
    }

    try {
      // @ts-expect-error - HKObjectType is not available in TypeScript types
      const workoutType = HKObjectType.workoutType();
      if (!workoutType) {
        return [];
      }

      // Query last 7 days to see if there are ANY workouts
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // @ts-expect-error - HKQuery is not available in TypeScript types
      const predicate = HKQuery.predicateForSamplesWithStartDateEndDateOptions(
        sevenDaysAgo,
        now,
        0,
      );

      return new Promise<HealthKitWorkout[]>((resolve) => {
        const sortDescriptor = NSSortDescriptor.sortDescriptorWithKeyAscending(
          'startDate',
          false,
        );

        const sortDescriptors = NSArray.arrayWithObject(sortDescriptor);

        const query =
          // @ts-expect-error - HKSampleQuery is not available in TypeScript types
          HKSampleQuery.alloc().initWithSampleTypePredicateLimitSortDescriptorsResultsHandler(
            workoutType,
            predicate,
            0,
            sortDescriptors,
            (query: any, samples: any, error: NSError) => {
              if (error) {
                console.error(
                  '[HealthKit] Error fetching workouts:',
                  error.localizedDescription,
                );
                console.error('[HealthKit] Error code:', error.code);
                return resolve([]);
              }

              const count = samples ? samples.count : 0;

              if (!samples || count === 0) {
                return resolve([]);
              }

              const workouts: HealthKitWorkout[] = [];
              const today = new Date();
              const startOfToday = new Date(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
                0,
                0,
                0,
              );

              for (let i = 0; i < count; i++) {
                const workout = samples.objectAtIndex(i);
                const workoutStart = workout.startDate;

                // Filter to only today's workouts
                if (workoutStart < startOfToday) {
                  continue;
                }

                let energyBurned = 0;
                const totalEnergy = workout.totalEnergyBurned;
                if (totalEnergy) {
                  // @ts-expect-error - HKUnit is not available in TypeScript types
                  const kcalUnit = HKUnit.kilocalorieUnit();
                  energyBurned = totalEnergy.doubleValueForUnit(kcalUnit);
                }

                const workoutData = {
                  workoutActivityType: Number(workout.workoutActivityType),
                  duration: workout.duration,
                  totalEnergyBurned: Math.round(energyBurned),
                  startDate: workout.startDate,
                  endDate: workout.endDate,
                  uuid: workout.UUID.UUIDString,
                };

                workouts.push(workoutData);
              }

              resolve(workouts);
            },
          );
        this.iosStore!.executeQuery(query);
      });
    } catch (error) {
      console.error('[HealthKit] Failed to fetch workouts:', error);
      return [];
    }
  }

  async getTodayStepsWithDetails(weight = 70): Promise<StepsDetails> {
    if (!isIOS || !this.iosStore) {
      return { steps: 0, kilometers: 0, caloriesBurned: 0 };
    }

    try {
      const steps = await this.getTodaySteps();

      // Calculate kilometers based on average stride length
      // Average stride length: ~0.762 meters per step
      const meters = steps * 0.762;
      const kilometers = meters / 1000;

      // Calculate calories burned from steps
      // Formula: calories = steps * weight(kg) * 0.00045
      const caloriesBurned = steps * weight * 0.00045;

      return {
        steps,
        kilometers: parseFloat(kilometers.toFixed(2)),
        caloriesBurned: Math.round(caloriesBurned),
      };
    } catch (error) {
      console.error('[HealthKit] Failed to get steps details:', error);
      return { steps: 0, kilometers: 0, caloriesBurned: 0 };
    }
  }

  async getTodayActiveEnergy(): Promise<number> {
    if (!isIOS || !this.iosStore) return 0;

    try {
      // @ts-expect-error - HKObjectType is not available in TypeScript types
      const energyType = HKObjectType.quantityTypeForIdentifier(
        // @ts-expect-error - HKQuantityTypeIdentifierActiveEnergyBurned is not available in TypeScript types
        HKQuantityTypeIdentifierActiveEnergyBurned,
      );
      if (!energyType) return 0;

      const now = new Date();
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
      );

      // @ts-expect-error - HKQuery is not available in TypeScript types
      const predicate = HKQuery.predicateForSamplesWithStartDateEndDateOptions(
        startOfDay,
        endOfDay,
        // @ts-expect-error - HKQueryOptions is not available in TypeScript types
        HKQueryOptions.StrictStartDate,
      );

      return new Promise<number>((resolve) => {
        const query =
          // @ts-expect-error - HKStatisticsQuery is not available in TypeScript types
          HKStatisticsQuery.alloc().initWithQuantityTypeQuantitySamplePredicateOptionsCompletionHandler(
            energyType,
            predicate,
            // @ts-expect-error - HKStatisticsOptions is not available in TypeScript types
            HKStatisticsOptions.CumulativeSum,
            (query: any, result: any, error: NSError) => {
              if (error) {
                console.error(
                  '[HealthKit] Error fetching active energy:',
                  error.localizedDescription,
                );
                return resolve(0);
              }
              if (!result) return resolve(0);

              const sum = result.sumQuantity();
              if (!sum) return resolve(0);
              // @ts-expect-error - HKUnit is not available in TypeScript types
              const unit = HKUnit.kilocalorieUnit();
              const energyBurned = sum.doubleValueForUnit(unit);
              resolve(Math.round(energyBurned));
            },
          );
        this.iosStore!.executeQuery(query);
      });
    } catch (error) {
      console.error('[HealthKit] Failed to fetch active energy:', error);
      return 0;
    }
  }
}
