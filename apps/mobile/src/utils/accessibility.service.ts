import { Injectable } from '@angular/core';
import { Application, Utils } from '@nativescript/core';

/**
 * Service to manage accessibility features for NativeScript mobile app
 * Supports VoiceOver (iOS) and TalkBack (Android)
 */
@Injectable({
  providedIn: 'root',
})
export class MobileAccessibilityService {
  /**
   * Check if screen reader is enabled
   * @returns true if VoiceOver (iOS) or TalkBack (Android) is active
   */
  isScreenReaderEnabled(): boolean {
    if (Application.ios) {
      return UIAccessibility.isVoiceOverRunning;
    } else if (Application.android) {
      const context = Utils.android.getApplicationContext();
      const am = context.getSystemService(
        android.content.Context.ACCESSIBILITY_SERVICE,
      ) as android.view.accessibility.AccessibilityManager;
      return am.isEnabled() && am.isTouchExplorationEnabled();
    }
    return false;
  }

  /**
   * Post an accessibility announcement
   * @param message - The message to announce
   */
  announceForAccessibility(message: string): void {
    if (Application.ios) {
      // UIAccessibility announcement for VoiceOver
      UIAccessibility.post(
        UIAccessibilityNotifications.Announcement,
        message,
      );
    } else if (Application.android) {
      // TalkBack announcement for Android
      const context = Utils.android.getApplicationContext();
      const view = Application.android.startActivity.getWindow().getDecorView();
      view.announceForAccessibility(message);
    }
  }

  /**
   * Check if user prefers reduced motion
   * iOS: checks for Reduce Motion setting
   * Android: checks for animation scale settings
   */
  prefersReducedMotion(): boolean {
    if (Application.ios) {
      return UIAccessibility.isReduceMotionEnabled;
    } else if (Application.android) {
      // Check global animation scale settings
      const context = Utils.android.getApplicationContext();
      const resolver = context.getContentResolver();
      try {
        const scale = android.provider.Settings.Global.getFloat(
          resolver,
          android.provider.Settings.Global.ANIMATOR_DURATION_SCALE,
          1.0,
        );
        return scale === 0.0;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Get minimum touch target size based on platform
   * iOS: 44x44 pt (Apple Human Interface Guidelines)
   * Android: 48x48 dp (Material Design Guidelines)
   */
  getMinimumTouchTargetSize(): number {
    return Application.ios ? 44 : 48;
  }

  /**
   * Check if larger text/font scaling is enabled
   * Returns the text scale factor
   */
  getTextScaleFactor(): number {
    if (Application.ios) {
      // Dynamic Type scale factor
      const app = UIApplication.sharedApplication;
      const contentSize =
        app.preferredContentSizeCategory as UIContentSizeCategory;
      // Map content size categories to scale factors
      const sizeMap: { [key: string]: number } = {
        [UIContentSizeCategory.ExtraSmall]: 0.8,
        [UIContentSizeCategory.Small]: 0.85,
        [UIContentSizeCategory.Medium]: 0.9,
        [UIContentSizeCategory.Large]: 1.0,
        [UIContentSizeCategory.ExtraLarge]: 1.15,
        [UIContentSizeCategory.ExtraExtraLarge]: 1.3,
        [UIContentSizeCategory.ExtraExtraExtraLarge]: 1.5,
      };
      return sizeMap[contentSize] || 1.0;
    } else if (Application.android) {
      const context = Utils.android.getApplicationContext();
      const config = context.getResources().getConfiguration();
      return config.fontScale;
    }
    return 1.0;
  }

  /**
   * Set focus to a specific view element
   * @param view - The native view to focus
   */
  setAccessibilityFocus(view: any): void {
    if (!view) return;

    if (Application.ios && view.ios) {
      // VoiceOver focus
      UIAccessibility.post(
        UIAccessibilityNotifications.ScreenChanged,
        view.ios,
      );
    } else if (Application.android && view.android) {
      // TalkBack focus
      view.android.sendAccessibilityEvent(
        android.view.accessibility.AccessibilityEvent.TYPE_VIEW_FOCUSED,
      );
      view.android.requestFocus();
    }
  }

  /**
   * Check if high contrast mode is enabled
   */
  isHighContrastEnabled(): boolean {
    if (Application.ios) {
      return (
        UIAccessibility.isDarkerSystemColorsEnabled ||
        UIAccessibility.isInvertColorsEnabled
      );
    }
    // Android doesn't have a standard high contrast API
    return false;
  }

  /**
   * Format number for accessibility announcement
   * @param value - The number to format
   * @param unit - Optional unit (e.g., "Gramm", "Kalorien")
   */
  formatNumberForA11y(value: number, unit?: string): string {
    const formatted = new Intl.NumberFormat('de-DE').format(value);
    return unit ? `${formatted} ${unit}` : formatted;
  }

  /**
   * Format date for accessibility announcement
   * @param date - The date to format
   */
  formatDateForA11y(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }
}
