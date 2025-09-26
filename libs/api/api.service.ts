import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { API_BASE_URL } from './tokens';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly router = inject(Router);
  private readonly baseUrl = inject(API_BASE_URL, { optional: true }) ?? '/api';

  private isRefreshing = false;
  private refreshSubscribers: Array<() => void> = [];

  // Token-based (native) auth support
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private csrfTokenMem: string | null = null;

  /**
   * Set or clear tokens for native auth flow. If tokens are present, ApiService
   * will use Authorization: Bearer and refresh via /auth/refresh-native.
   */
  setTokens(
    tokens: {
      accessToken?: string | null;
      refreshToken?: string | null;
      csrfToken?: string | null;
    } | null,
  ): void {
    if (!tokens) {
      this.accessToken = null;
      this.refreshToken = null;
      this.csrfTokenMem = null;
      return;
    }
    this.accessToken = tokens.accessToken ?? this.accessToken ?? null;
    this.refreshToken = tokens.refreshToken ?? this.refreshToken ?? null;
    this.csrfTokenMem = tokens.csrfToken ?? this.csrfTokenMem ?? null;
  }

  private onRefreshed(): void {
    this.refreshSubscribers.forEach((cb) => cb());
    this.refreshSubscribers = [];
  }

  private subscribeTokenRefresh(cb: () => void): void {
    this.refreshSubscribers.push(cb);
  }

  private getCookie(name: string): string {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()!.split(';').shift()!;
    return '';
  }

  private getCsrfToken(): string {
    // Prefer memory token when set via native login
    if (this.csrfTokenMem) return this.csrfTokenMem;
    return this.getCookie('csrfToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T | undefined> {
    const csrfToken = this.getCsrfToken();
    const init: RequestInit = {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
        ...(options.headers as Record<string, string> | undefined),
      },
    };

    // If we have an access token (native flow), attach it
    if (this.accessToken) {
      (init.headers as Record<string, string>) = {
        ...(init.headers as Record<string, string>),
        Authorization: `Bearer ${this.accessToken}`,
      };
    }

    const url = `${this.baseUrl}${endpoint}`;
    let response: Response;
    try {
      response = await fetch(url, init);
    } catch (networkError) {
      throw {
        message: 'Netzwerkfehler oder CORS-Problem',
        details: networkError,
      } as const;
    }

    if (response.status === 401) {
      // Do not refresh for login/refresh endpoints
      if (endpoint === '/auth/login' || endpoint === '/auth/refresh') {
        // fall through to error handling below
      } else if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          if (this.refreshToken) {
            // Native token refresh flow
            const refreshResp = await fetch(
              `${this.baseUrl}/auth/refresh-native`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-refresh-token': this.refreshToken,
                },
              },
            );
            if (!refreshResp.ok) {
              let errBody: unknown;
              try {
                errBody = await refreshResp.json();
              } catch {
                errBody = undefined;
              }
              throw { status: refreshResp.status, body: errBody };
            }
            const data = (await refreshResp.json()) as any;
            this.setTokens({
              accessToken: data?.accessToken ?? null,
              refreshToken: data?.refreshToken ?? this.refreshToken,
              csrfToken: data?.csrfToken ?? null,
            });
          } else {
            // Cookie-based refresh flow (web / legacy)
            const refreshResp = await fetch(`${this.baseUrl}/auth/refresh`, {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
              },
            });
            if (!refreshResp.ok) {
              let errBody: unknown;
              try {
                errBody = await refreshResp.json();
              } catch {
                errBody = undefined;
              }
              throw { status: refreshResp.status, body: errBody };
            }
          }

          this.isRefreshing = false;
          this.onRefreshed();
          // retry original request (with possibly new Authorization header)
          response = await fetch(url, init);
        } catch (error: any) {
          this.isRefreshing = false;
          // Only redirect when real 401 from refresh
          if (error?.status === 401) {
            // clear tokens on hard auth failure
            this.setTokens(null);
            this.router.navigateByUrl('/login').catch(() => {});
          }
          return Promise.reject(error);
        }
      } else {
        // Queue the request until refresh completes
        return new Promise<T | undefined>((resolve, reject) => {
          this.subscribeTokenRefresh(() => {
            fetch(url, init)
              .then(async (r) => {
                if (!r.ok) {
                  let errorBody: unknown;
                  try {
                    errorBody = await r.json();
                  } catch {
                    errorBody = {
                      message: 'Ein unbekannter Fehler ist aufgetreten',
                    };
                  }
                  return reject(errorBody);
                }
                if (
                  r.status === 204 ||
                  r.headers.get('content-length') === '0'
                ) {
                  resolve(undefined);
                } else {
                  resolve((await r.json()) as T);
                }
              })
              .catch((e) => reject(e));
          });
        });
      }
    }

    if (!response.ok) {
      let errorBody: any;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: 'Ein unbekannter Fehler ist aufgetreten' };
      }
      if (errorBody && (errorBody.message || (errorBody as any)?.messages)) {
        throw errorBody;
      }
      throw { message: 'Ein unbekannter Fehler ist aufgetreten' } as const;
    }

    if (
      response.status === 204 ||
      response.headers.get('content-length') === '0'
    ) {
      return undefined;
    }
    return (await response.json()) as T;
  }

  get<T>(endpoint: string, init?: RequestInit): Promise<T | undefined> {
    return this.request<T>(endpoint, { method: 'GET', ...init });
  }

  post<T>(
    endpoint: string,
    body: unknown,
    init?: RequestInit,
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...init,
    });
  }

  put<T>(
    endpoint: string,
    body: unknown,
    init?: RequestInit,
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...init,
    });
  }

  patch<T>(
    endpoint: string,
    body: unknown,
    init?: RequestInit,
  ): Promise<T | undefined> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...init,
    });
  }

  delete<T>(endpoint: string, init?: RequestInit): Promise<T | undefined> {
    return this.request<T>(endpoint, { method: 'DELETE', ...init });
  }

  // AI service wrappers (generic to avoid tight coupling)
  apiGenerateMealPlan<TOptions = unknown, TResult = unknown>(
    options: TOptions,
  ) {
    return this.post<TResult>('/ai/generate-plan', options);
  }

  apiGenerateSingleMeal<TOptions = unknown, TResult = unknown>(payload: {
    planOptions: TOptions;
    mealType: string;
    otherMealNames: string[];
    recipeHadNutrition: boolean;
  }) {
    return this.post<TResult>('/ai/generate-single-meal', payload);
  }

  apiCategorizeShoppingList<TIngredient = unknown, TResult = unknown>(
    ingredients: TIngredient[],
  ) {
    return this.post<TResult>('/ai/categorize-list', { ingredients });
  }

  apiTransformRecipe<TRecipe = unknown, TResult = unknown>(
    recipe: TRecipe,
    modification: string,
  ) {
    return this.post<TResult>('/ai/transform-recipe', { recipe, modification });
  }

  apiGenerateLeftoverRecipe<TResult = unknown>(
    ingredients: string,
    signal?: AbortSignal,
  ) {
    return this.post<TResult>(
      '/ai/generate-leftover',
      { ingredients },
      { signal },
    );
  }
}
