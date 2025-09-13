// libs/core/auth/src/lib/guards/protected-route.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { protectedRouteGuard } from './protected-route.guard';
import { AuthService } from '../services/auth.service';

describe('protectedRouteGuard', () => {
  let auth: AuthService;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      providers: [AuthService],
    });

    auth = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
  });

  it('blocks when loading', () => {
    auth.setLoading(true);
    const result = TestBed.runInInjectionContext(() => protectedRouteGuard({ data: {} } as any, {} as any));
    expect(result).toBeFalse();
  });

  it('redirects to /landing and blocks when not authenticated', () => {
    const navSpy = spyOn(router, 'navigateByUrl');
    auth.setLoading(false);
    auth.setCurrentUser(null);
    const result = TestBed.runInInjectionContext(() => protectedRouteGuard({ data: {} } as any, {} as any));
    expect(result).toBeFalse();
    expect(navSpy).toHaveBeenCalledWith('/landing');
  });

  it('redirects to /landing on role mismatch', () => {
    const navSpy = spyOn(router, 'navigateByUrl');
    auth.setLoading(false);
    auth.setCurrentUser({ id: '1', role: 'user', email: 'u@example.com' });
    const result = TestBed.runInInjectionContext(() => protectedRouteGuard({ data: { requiredRole: 'admin' } } as any, {} as any));
    expect(result).toBeFalse();
    expect(navSpy).toHaveBeenCalledWith('/landing');
  });

  it('allows when authenticated and role matches or absent', () => {
    auth.setLoading(false);
    auth.setCurrentUser({ id: '1', role: 'admin', email: 'a@example.com' });
    const result1 = TestBed.runInInjectionContext(() => protectedRouteGuard({ data: {} } as any, {} as any));
    expect(result1).toBeTrue();
    const result2 = TestBed.runInInjectionContext(() => protectedRouteGuard({ data: { requiredRole: 'admin' } } as any, {} as any));
    expect(result2).toBeTrue();
  });
});

