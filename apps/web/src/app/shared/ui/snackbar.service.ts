import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type SnackbarLevel = 'info' | 'success' | 'error' | 'warning';
export interface SnackbarMessage {
  text: string;
  level: SnackbarLevel;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly _message$ = new BehaviorSubject<SnackbarMessage | null>(null);
  readonly message$ = this._message$.asObservable();
  private hideTimer: any = null;

  show(text: string, level: SnackbarLevel = 'info', duration = 3000) {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this._message$.next({ text, level, duration });
    this.hideTimer = setTimeout(() => this.clear(), duration);
  }

  info(text: string, duration = 3000) { this.show(text, 'info', duration); }
  success(text: string, duration = 3000) { this.show(text, 'success', duration); }
  error(text: string, duration = 4000) { this.show(text, 'error', duration); }
  warning(text: string, duration = 3500) { this.show(text, 'warning', duration); }

  clear() {
    if (this.hideTimer) clearTimeout(this.hideTimer);
    this.hideTimer = null;
    this._message$.next(null);
  }
}

