import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from '../../services/accessibility.service';
import { Subscription } from 'rxjs';

/**
 * Component to provide ARIA live region for screen reader announcements
 * This should be included once in the app root
 */
@Component({
  selector: 'app-live-announcer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      class="sr-only"
      id="live-announcer-polite"
    ></div>
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      class="sr-only"
      id="live-announcer-assertive"
    ></div>
  `,
})
export class LiveAnnouncerComponent implements OnInit, OnDestroy {
  private subscription?: Subscription;

  constructor(private a11y: AccessibilityService) {}

  ngOnInit(): void {
    // Component is intentionally simple - announcements handled by service
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
