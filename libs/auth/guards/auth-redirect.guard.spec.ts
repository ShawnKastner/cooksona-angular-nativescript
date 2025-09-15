// libs/core/auth/src/lib/guards/auth-redirect.guard.spec.ts
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { authRedirectGuard } from './auth-redirect.guard';
import { AuthService } from '../services/auth.service';

describe('authRedirectGuard', () => {
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

  it('allows navigation when no user', () => {
    auth.setCurrentUser(null);
    const result = TestBed.runInInjectionContext(() =>
      authRedirectGuard({} as any, {} as any)
    );
    expect(result).toBeTrue();
  });

  it('redirects to / and blocks when user exists', () => {
    const navigateSpy = spyOn(router, 'navigateByUrl');
    auth.setCurrentUser({ id: '1', role: 'user', email: 'u@example.com' });
    const result = TestBed.runInInjectionContext(() =>
      authRedirectGuard({} as any, {} as any)
    );
    expect(result).toBeFalse();
    expect(navigateSpy).toHaveBeenCalledWith('/');
  });
});
