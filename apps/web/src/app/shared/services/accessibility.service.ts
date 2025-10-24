import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Service to manage accessibility features across the application
 * Implements WCAG 2.1 AA compliance requirements
 */
@Injectable({
  providedIn: 'root',
})
export class AccessibilityService {
  private readonly announcements$ = new Subject<string>();
  private readonly focusManagement$ = new Subject<HTMLElement>();

  /**
   * Announce a message to screen readers using ARIA live regions
   * @param message - The message to announce
   * @param priority - 'polite' (default) or 'assertive'
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announcements$.next(message);
    
    // Create temporary live region for announcement
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.setAttribute('class', 'sr-only');
    liveRegion.textContent = message;
    
    document.body.appendChild(liveRegion);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion);
    }, 1000);
  }

  /**
   * Set focus to an element with proper focus management
   * @param element - The element to focus
   * @param preventScroll - Whether to prevent scroll on focus
   */
  setFocus(element: HTMLElement | null, preventScroll = false): void {
    if (!element) return;
    
    // Make element focusable if it isn't already
    if (!element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '-1');
    }
    
    element.focus({ preventScroll });
    this.focusManagement$.next(element);
  }

  /**
   * Trap focus within a container (useful for modals)
   * @param container - The container element
   * @returns Function to release the trap
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    
    if (focusableElements.length === 0) return () => {};
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      
      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Set initial focus
    firstElement.focus();
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Get all focusable elements within a container
   * @param container - The container to search
   * @returns Array of focusable elements
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(',');
    
    return Array.from(container.querySelectorAll(selector));
  }

  /**
   * Check if user prefers reduced motion
   */
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Check if user prefers high contrast
   */
  prefersHighContrast(): boolean {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }

  /**
   * Get ARIA label for a date
   * @param date - The date to format
   * @returns Accessible date string
   */
  getAccessibleDate(date: Date): string {
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Generate unique ID for accessibility relationships (aria-labelledby, aria-describedby)
   * @param prefix - Optional prefix for the ID
   */
  generateId(prefix = 'a11y'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
