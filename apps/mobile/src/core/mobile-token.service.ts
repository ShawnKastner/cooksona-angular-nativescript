import { Injectable, OnDestroy } from '@angular/core';
import { ApplicationSettings } from '@nativescript/core';
import { ApiService } from '@cooksona/api';
import { Subscription } from 'rxjs';

const KEY = 'auth.tokens.v1';

@Injectable({ providedIn: 'root' })
export class MobileTokenService implements OnDestroy {
  private sub: Subscription;

  constructor(private api: ApiService) {
    // Subscribe to token changes and persist
    this.sub = this.api.tokens$.subscribe((t) => {
      try {
        if (!t) return;
        const allNull = !t.accessToken && !t.refreshToken && !t.csrfToken;
        if (allNull) {
          // treat all-null as clear
          ApplicationSettings.remove(KEY);
          return;
        }
        ApplicationSettings.setString(KEY, JSON.stringify(t));
      } catch (e) {
        console.warn('[MobileTokenService] persist tokens failed', e);
      }
    });
  }

  /**
   * Rehydrate tokens from device storage into ApiService. Returns true if tokens
   * were found and applied, false otherwise. On corrupt JSON, clears the key.
   */
  hydrate(): boolean {
    try {
      const raw = ApplicationSettings.getString(KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw) as {
        accessToken: string | null;
        refreshToken: string | null;
        csrfToken: string | null;
      };
      this.api.setTokens(parsed);
      return true;
    } catch (e) {
      console.warn(
        '[MobileTokenService] hydrate failed; clearing stored tokens',
        e,
      );
      try {
        ApplicationSettings.remove(KEY);
      } catch {}
      return false;
    }
  }

  clear(): void {
    try {
      ApplicationSettings.remove(KEY);
    } catch (e) {
      console.warn('[MobileTokenService] clear failed', e);
    }
  }

  ngOnDestroy(): void {
    try {
      this.sub?.unsubscribe();
    } catch (e) {
      console.warn('[MobileTokenService] unsubscribe failed', e);
    }
  }
}
