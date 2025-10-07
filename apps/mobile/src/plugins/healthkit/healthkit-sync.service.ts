import { Injectable, inject } from '@angular/core';
import { isIOS, ApplicationSettings } from '@nativescript/core';
import { HealthKitService, HealthKitWorkout } from './healthkit.service';
import { mapWorkoutTypeToActivityType } from './workout-type-mapper';
import { HealthApiService } from '@cooksona/api';
import { getDateString } from '@cooksona/models';

@Injectable({ providedIn: 'root' })
export class HealthKitSyncService {
  private readonly healthKit = inject(HealthKitService);
  private readonly healthApi = inject(HealthApiService);

  private readonly SYNCED_WORKOUTS_KEY = 'healthkit_synced_workout_uuids';
  private isSyncing = false;

  /**
   * Sync today's workouts from Apple Health to the backend
   * Only syncs workouts that haven't been synced before
   */
  async syncTodayWorkouts(): Promise<{ synced: number; skipped: number }> {
    console.log('[HealthKit Sync] Starting workout sync...');

    // Check if already syncing
    if (this.isSyncing) {
      console.log('[HealthKit Sync] Sync already in progress, skipping...');
      return { synced: 0, skipped: 0 };
    }

    // Check if connected
    const isConnected = ApplicationSettings.getBoolean(
      'healthkit_connected',
      false,
    );
    console.log(
      '[HealthKit Sync] Connected:',
      isConnected,
      'isIOS:',
      isIOS,
      'Available:',
      this.healthKit.isAvailable(),
    );

    if (!isConnected || !isIOS || !this.healthKit.isAvailable()) {
      console.log('[HealthKit Sync] HealthKit not connected or not available');
      return { synced: 0, skipped: 0 };
    }

    try {
      this.isSyncing = true;

      // Get today's workouts from HealthKit
      console.log('[HealthKit Sync] Fetching workouts from HealthKit...');
      const workouts = await this.healthKit.getTodayWorkouts();
      console.log(`[HealthKit Sync] Found ${workouts.length} workout(s)`);

      if (workouts.length === 0) {
        console.log('[HealthKit Sync] No workouts found for today');
        return { synced: 0, skipped: 0 };
      }

      // Get already synced workout UUIDs
      const syncedUuids = this.getSyncedWorkoutUuids();
      console.log(`[HealthKit Sync] Already synced UUIDs:`, syncedUuids);

      let syncedCount = 0;
      let skippedCount = 0;

      // Process each workout
      for (const workout of workouts) {
        console.log(`[HealthKit Sync] Processing workout:`, {
          uuid: workout.uuid,
          type: workout.workoutActivityType,
          duration: workout.duration,
          calories: workout.totalEnergyBurned,
          alreadySynced: syncedUuids.includes(workout.uuid),
        });

        // Skip if already synced
        if (syncedUuids.includes(workout.uuid)) {
          console.log(
            `[HealthKit Sync] Skipping already synced workout: ${workout.uuid}`,
          );
          skippedCount++;
          continue;
        }

        // Skip if no energy burned (invalid workout)
        if (workout.totalEnergyBurned === 0) {
          console.log(
            `[HealthKit Sync] Skipping workout with 0 calories: ${workout.uuid}`,
          );
          skippedCount++;
          continue;
        }

        try {
          // Map workout type
          const activityType = mapWorkoutTypeToActivityType(
            workout.workoutActivityType,
          );

          // Calculate duration in minutes
          const durationMinutes = Math.round(workout.duration / 60);

          console.log(`[HealthKit Sync] Syncing to backend:`, {
            activityType,
            durationMinutes,
            caloriesBurned: workout.totalEnergyBurned,
            date: getDateString(workout.startDate),
          });

          // Sync to backend
          await this.healthApi.trackActivity({
            date: getDateString(workout.startDate),
            activityType,
            durationMinutes: Math.max(1, durationMinutes), // Ensure at least 1 minute
            caloriesBurned: workout.totalEnergyBurned,
            isFromAppleHealth: true, // Mark as Apple Health source
          });

          // Mark as synced
          this.addSyncedWorkoutUuid(workout.uuid);
          syncedCount++;

          console.log(
            `[HealthKit Sync] ✅ Synced workout: ${activityType}, ${durationMinutes}min, ${workout.totalEnergyBurned}kcal`,
          );
        } catch (error) {
          console.error('[HealthKit Sync] ❌ Failed to sync workout:', error);
          skippedCount++;
        }
      }

      console.log(
        `[HealthKit Sync] Sync complete: ${syncedCount} synced, ${skippedCount} skipped`,
      );
      return { synced: syncedCount, skipped: skippedCount };
    } catch (error) {
      console.error('[HealthKit Sync] Failed to sync workouts:', error);
      return { synced: 0, skipped: 0 };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Get list of already synced workout UUIDs
   */
  private getSyncedWorkoutUuids(): string[] {
    const stored = ApplicationSettings.getString(this.SYNCED_WORKOUTS_KEY, '');
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  /**
   * Add a workout UUID to the synced list
   */
  private addSyncedWorkoutUuid(uuid: string): void {
    const uuids = this.getSyncedWorkoutUuids();
    if (!uuids.includes(uuid)) {
      uuids.push(uuid);

      // Keep only last 100 UUIDs to prevent storage bloat
      const trimmed = uuids.slice(-100);
      ApplicationSettings.setString(
        this.SYNCED_WORKOUTS_KEY,
        JSON.stringify(trimmed),
      );
    }
  }

  /**
   * Clear all synced workout UUIDs (for testing or reset)
   */
  clearSyncedWorkouts(): void {
    ApplicationSettings.remove(this.SYNCED_WORKOUTS_KEY);
  }

  /**
   * Sync today's steps to the backend daily metrics API
   * Updates every time since steps change throughout the day
   */
  async syncTodaySteps(): Promise<{ synced: boolean; steps: number }> {
    console.log('[HealthKit Sync] Starting steps sync...');

    // Check if connected
    const isConnected = ApplicationSettings.getBoolean(
      'healthkit_connected',
      false,
    );
    if (!isConnected || !isIOS || !this.healthKit.isAvailable()) {
      console.log('[HealthKit Sync] HealthKit not connected or not available');
      return { synced: false, steps: 0 };
    }

    try {
      // Get weight from health data for calorie calculation (default 70kg)
      const healthData = await this.healthApi.getHealthState();
      const weight = healthData?.userProfile?.weight || 70;
      console.log(
        `[HealthKit Sync] Using weight: ${weight}kg for calculations`,
      );

      // Get steps details from HealthKit
      const stepsDetails =
        await this.healthKit.getTodayStepsWithDetails(weight);
      console.log(`[HealthKit Sync] Steps details:`, stepsDetails);
      console.log(
        `[HealthKit Sync] Found ${stepsDetails.steps} steps, ${stepsDetails.kilometers} km, ${stepsDetails.caloriesBurned} kcal for today`,
      );

      if (stepsDetails.steps === 0) {
        console.log('[HealthKit Sync] No steps to sync');
        return { synced: false, steps: 0 };
      }

      // Sync to backend using daily metrics API with all details
      console.log('[HealthKit Sync] Syncing to backend:', {
        steps: stepsDetails.steps,
        stepsKilometers: stepsDetails.kilometers,
        stepsCalories: stepsDetails.caloriesBurned,
      });

      await this.healthApi.updateTodayMetrics({
        steps: stepsDetails.steps,
        stepsKilometers: stepsDetails.kilometers,
        stepsCalories: stepsDetails.caloriesBurned,
      });

      console.log(
        `[HealthKit Sync] ✅ Synced ${stepsDetails.steps} steps (${stepsDetails.kilometers} km, ${stepsDetails.caloriesBurned} kcal) to daily metrics`,
      );
      return { synced: true, steps: stepsDetails.steps };
    } catch (error) {
      console.error('[HealthKit Sync] Failed to sync steps:', error);
      return { synced: false, steps: 0 };
    }
  }

  /**
   * Force resync of steps (now just calls syncTodaySteps since it always updates)
   */
  async forceResyncSteps(): Promise<{ synced: boolean; steps: number }> {
    console.log('[HealthKit Sync] Force resync steps...');
    return this.syncTodaySteps();
  }

  /**
   * Sync today's active energy as an activity
   * Updates every time since active energy changes throughout the day
   */
  async syncTodayActiveEnergy(): Promise<{
    synced: boolean;
    calories: number;
  }> {
    console.log('[HealthKit Sync] Starting active energy sync...');
    console.log('[HealthKit Sync] HealthKit service:', this.healthKit);
    console.log(
      '[HealthKit Sync] getTodayActiveEnergy method type:',
      typeof this.healthKit.getTodayActiveEnergy,
    );

    // Check if connected
    const isConnected = ApplicationSettings.getBoolean(
      'healthkit_connected',
      false,
    );
    if (!isConnected || !isIOS || !this.healthKit.isAvailable()) {
      console.log('[HealthKit Sync] HealthKit not connected or not available');
      return { synced: false, calories: 0 };
    }

    try {
      const today = getDateString(new Date());

      // Get active energy from HealthKit
      console.log('[HealthKit Sync] Calling getTodayActiveEnergy...');
      const activeEnergy = await this.healthKit.getTodayActiveEnergy();
      console.log(
        `[HealthKit Sync] Found ${activeEnergy} kcal active energy for today`,
      );

      if (activeEnergy === 0) {
        console.log('[HealthKit Sync] No active energy to sync');
        return { synced: false, calories: 0 };
      }

      // Check if activity already exists for today
      const activities = await this.healthApi.listActivities({ date: today });
      const existingActivity = activities.find(
        (a) => a.activityType === 'active_energy' && a.isFromAppleHealth,
      );

      if (existingActivity) {
        // Update existing activity
        console.log(
          '[HealthKit Sync] Updating existing active energy activity:',
          existingActivity.id,
        );
        await this.healthApi.updateActivity(existingActivity.id, {
          caloriesBurned: activeEnergy,
        });
      } else {
        // Create new activity
        console.log('[HealthKit Sync] Creating new active energy activity');
        await this.healthApi.trackActivity({
          date: today,
          activityType: 'active_energy', // Special type for active energy
          durationMinutes: 1440, // Full day (24 hours * 60 minutes)
          caloriesBurned: activeEnergy,
          isFromAppleHealth: true,
        });
      }

      console.log(
        `[HealthKit Sync] ✅ Synced ${activeEnergy} kcal active energy as activity`,
      );
      return { synced: true, calories: activeEnergy };
    } catch (error) {
      console.error('[HealthKit Sync] Failed to sync active energy:', error);
      return { synced: false, calories: 0 };
    }
  }

  /**
   * Force resync of active energy (now just calls syncTodayActiveEnergy since it always updates)
   */
  async forceResyncActiveEnergy(): Promise<{
    synced: boolean;
    calories: number;
  }> {
    console.log('[HealthKit Sync] Force resync active energy...');
    return this.syncTodayActiveEnergy();
  }
}
