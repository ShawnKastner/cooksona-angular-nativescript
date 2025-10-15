import { Injectable } from '@angular/core';

export type RecipeTrackingEvent = {
  action: 'create' | 'update';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  portion: number;
  platform: 'web' | 'mobile';
};

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly optOutStorageKey = 'cooksona.analytics.optOut';

  private isEnabled(): boolean {
    try {
      const runtime = (globalThis as any).__env;
      if (runtime && runtime.analyticsEnabled === false) {
        return false;
      }
    } catch {}
    return !this.isOptedOut();
  }

  private isOptedOut(): boolean {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(this.optOutStorageKey) === '1';
      }
    } catch {}
    try {
      const appSettings = require('@nativescript/core').ApplicationSettings;
      return appSettings.getBoolean(this.optOutStorageKey, false);
    } catch {
      // Not running in NativeScript context
    }
    return false;
  }

  trackRecipeTracking(event: RecipeTrackingEvent): void {
    if (!this.isEnabled()) return;
    try {
      console.info('[analytics]', 'recipeTracking', {
        action: event.action,
        mealType: event.mealType,
        portion: Number(event.portion.toFixed(2)),
        platform: event.platform,
      });
    } catch {
      // Silently ignore analytics errors
    }
  }
}
