import { Injectable, inject } from '@angular/core';
import { ApplicationSettings } from '@nativescript/core';
import { ApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';

interface NotificationPreferencesResponse {
  waterReminderEnabled?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationPreferencesService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly LOCAL_KEY_PREFIX = 'water_reminder_enabled';

  private get storageKey(): string {
    const userId = this.auth.currentUser?.id ?? 'anonymous';
    return `${this.LOCAL_KEY_PREFIX}:${userId}`;
  }

  getCachedWaterReminderEnabled(): boolean {
    return ApplicationSettings.getBoolean(this.storageKey, false);
  }

  async getWaterReminderEnabled(): Promise<boolean> {
    try {
      const response = await this.api.get<
        NotificationPreferencesResponse | undefined
      >('/notifications/preferences');
      if (response && typeof response.waterReminderEnabled === 'boolean') {
        ApplicationSettings.setBoolean(
          this.storageKey,
          response.waterReminderEnabled,
        );
        return response.waterReminderEnabled;
      }
    } catch (error) {
      console.warn(
        '[NotificationPreferencesService] Loading remote preferences failed, falling back to local cache.',
        error,
      );
    }
    return this.getCachedWaterReminderEnabled();
  }

  async setWaterReminderEnabled(enabled: boolean): Promise<void> {
    ApplicationSettings.setBoolean(this.storageKey, enabled);
    try {
      // Attempt to include the current server resource version to satisfy
      // optimistic concurrency checks. The backend accepts either an If-Match
      // header or a `version` field in the payload.
      let version: number | undefined;
      try {
        const current = await this.api.get<
          { waterReminderEnabled?: boolean; version?: number } | undefined
        >('/notifications/preferences');
        version = (current as any)?.version;
      } catch (e) {
        // ignore - we'll still attempt the put without a version field
      }

      const payload: any = { waterReminderEnabled: enabled };
      if (typeof version === 'number') {
        payload.version = version;
      }

      await this.api.put('/notifications/preferences', payload);
    } catch (error) {
      console.warn(
        '[NotificationPreferencesService] Persisting remote preferences failed.',
        error,
      );
    }
  }
}
