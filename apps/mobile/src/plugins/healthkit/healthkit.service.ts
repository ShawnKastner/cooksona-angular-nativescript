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
  private iosStore: HKHealthStore | null = null;

  constructor() {
    if (isIOS) {
      // @ts-ignore
      this.iosStore = HKHealthStore.new();
    }
  }

  isAvailable(): boolean {
    if (!isIOS) return false;
    // @ts-ignore
    return HKHealthStore.isHealthDataAvailable();
  }

  checkAuthorized(): boolean {
    if (!isIOS || !this.iosStore) return false;
    // @ts-ignore
    const stepsType = HKObjectType.quantityTypeForIdentifier(
      HKQuantityTypeIdentifierStepCount,
    );
    if (!stepsType) return false;
    // @ts-ignore
    const status = this.iosStore.authorizationStatusForType(stepsType);
    return Number(status) === 2;
  }

  async requestAuthorization(): Promise<void> {
    if (!isIOS || !this.iosStore) {
      throw new Error('Apple Health is only available on iOS devices.');
    }
    // @ts-ignore
    const readItems = NSMutableArray.new();
    // @ts-ignore
    readItems.addObject(HKObjectType.workoutType());
    // @ts-ignore
    const stepsType = HKObjectType.quantityTypeForIdentifier(
      HKQuantityTypeIdentifierStepCount,
    );
    if (stepsType) readItems.addObject(stepsType);
    // @ts-ignore
    const energyType = HKObjectType.quantityTypeForIdentifier(
      HKQuantityTypeIdentifierActiveEnergyBurned,
    );
    if (energyType) readItems.addObject(energyType);
    // @ts-ignore
    const routeType = HKObjectType.seriesTypeForIdentifier(
      HKWorkoutRouteTypeIdentifier,
    );
    if (routeType) readItems.addObject(routeType);
    // @ts-ignore
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
      // @ts-ignore
      const stepsType = HKObjectType.quantityTypeForIdentifier(
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

      // @ts-ignore
      const predicate = HKQuery.predicateForSamplesWithStartDateEndDateOptions(
        startOfDay,
        endOfDay,
        // @ts-ignore
        HKQueryOptions.StrictStartDate,
      );

      return new Promise<number>((resolve) => {
        // @ts-ignore
        const query =
          HKStatisticsQuery.alloc().initWithQuantityTypeQuantitySamplePredicateOptionsCompletionHandler(
            stepsType,
            predicate,
            // @ts-ignore
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
              // @ts-ignore
              const sum = result.sumQuantity();
              if (!sum) return resolve(0);
              // @ts-ignore
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
      // @ts-ignore
      const workoutType = HKObjectType.workoutType();
      if (!workoutType) {
        return [];
      }

      // Query last 7 days to see if there are ANY workouts
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // @ts-ignore
      const predicate = HKQuery.predicateForSamplesWithStartDateEndDateOptions(
        sevenDaysAgo,
        now,
        0,
      );

      // Check authorization for workout type
      // @ts-ignore
      const authStatus = this.iosStore!.authorizationStatusForType(workoutType);

      return new Promise<HealthKitWorkout[]>((resolve) => {
        // @ts-ignore
        const sortDescriptor = NSSortDescriptor.sortDescriptorWithKeyAscending(
          'startDate',
          false,
        );
        // @ts-ignore
        const sortDescriptors = NSArray.arrayWithObject(sortDescriptor);

        // @ts-ignore
        const query =
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
                // @ts-ignore
                const totalEnergy = workout.totalEnergyBurned;
                if (totalEnergy) {
                  // @ts-ignore
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

  async getTodayStepsWithDetails(weight: number = 70): Promise<StepsDetails> {
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
      // @ts-ignore
      const energyType = HKObjectType.quantityTypeForIdentifier(
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

      // @ts-ignore
      const predicate = HKQuery.predicateForSamplesWithStartDateEndDateOptions(
        startOfDay,
        endOfDay,
        // @ts-ignore
        HKQueryOptions.StrictStartDate,
      );

      return new Promise<number>((resolve) => {
        // @ts-ignore
        const query =
          HKStatisticsQuery.alloc().initWithQuantityTypeQuantitySamplePredicateOptionsCompletionHandler(
            energyType,
            predicate,
            // @ts-ignore
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
              // @ts-ignore
              const sum = result.sumQuantity();
              if (!sum) return resolve(0);
              // @ts-ignore
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
