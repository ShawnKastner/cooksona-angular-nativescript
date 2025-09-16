import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SnackbarService, SnackbarMessage } from './snackbar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (msg) {
    <div
      class="fixed bottom-6 right-6 z-50 max-w-sm w-[min(90vw,28rem)] shadow-soft-xl"
      [ngClass]="bgClass(msg.level)"
      role="status"
      aria-live="polite"
    >
      <div class="px-4 py-3 rounded-xl flex items-start gap-3">
        <span
          class="inline-block w-2 h-2 rounded-full mt-2"
          [ngClass]="dotClass(msg.level)"
        ></span>
        <div class="text-sm font-semibold text-neutral-800">{{ msg.text }}</div>
      </div>
    </div>
    }
  `,
})
export class SnackbarComponent implements OnDestroy {
  msg: SnackbarMessage | null = null;
  private sub: Subscription;

  constructor(private readonly svc: SnackbarService) {
    this.sub = this.svc.message$.subscribe((m) => (this.msg = m));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  bgClass(level: SnackbarMessage['level']): string {
    switch (level) {
      case 'success':
        return 'bg-green-50 border border-green-200';
      case 'error':
        return 'bg-red-50 border border-red-200';
      case 'warning':
        return 'bg-yellow-50 border border-yellow-200';
      default:
        return 'bg-base-100 border border-base-200';
    }
  }

  dotClass(level: SnackbarMessage['level']): string {
    switch (level) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-400';
    }
  }
}
