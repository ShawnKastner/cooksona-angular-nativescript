import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { ApiService } from '@cooksona/api';
import { User } from '@cooksona/models/user.models';

describe('AuthService', () => {
  let service: AuthService;
  let apiServiceMock: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    apiServiceMock = jasmine.createSpyObj('ApiService', [
      'get',
      'post',
      'put',
      'delete',
      'setTokens',
    ]);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: ApiService, useValue: apiServiceMock },
      ],
    });

    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('currentUser', () => {
    it('should return null by default', () => {
      expect(service.currentUser).toBeNull();
    });

    it('should update when setCurrentUser is called', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      } as User;

      service.setCurrentUser(user);

      expect(service.currentUser).toBe(user);
    });
  });

  describe('isLoading', () => {
    it('should return false by default', () => {
      expect(service.isLoading).toBeFalse();
    });

    it('should update when setLoading is called', () => {
      service.setLoading(true);
      expect(service.isLoading).toBeTrue();

      service.setLoading(false);
      expect(service.isLoading).toBeFalse();
    });
  });

  describe('hasRole', () => {
    it('should return false when no user is logged in', () => {
      expect(service.hasRole('admin')).toBeFalse();
    });

    it('should return true when user has the role', () => {
      const adminUser: User = {
        id: '1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
      } as User;

      service.setCurrentUser(adminUser);
      expect(service.hasRole('admin')).toBeTrue();
    });

    it('should return false when user does not have the role', () => {
      const user: User = {
        id: '1',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
      } as User;

      service.setCurrentUser(user);
      expect(service.hasRole('admin')).toBeFalse();
    });
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      } as User;

      apiServiceMock.post.and.resolveTo({ user: mockUser });

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockUser);
      expect(service.currentUser).toEqual(mockUser);
      expect(apiServiceMock.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should handle login failure', async () => {
      apiServiceMock.post.and.rejectWith({ message: 'Invalid credentials' });

      try {
        await service.login({
          email: 'test@example.com',
          password: 'wrong',
        });
        fail('Expected error to be thrown');
      } catch (e: any) {
        expect(e.context).toBe('login');
        expect(e.message).toContain('Invalid credentials');
      }
    });
  });

  describe('logout', () => {
    it('should clear current user', () => {
      const user: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      } as User;

      service.setCurrentUser(user);
      expect(service.currentUser).toBe(user);

      apiServiceMock.post.and.resolveTo({});
      service.logout();

      expect(service.currentUser).toBeNull();
      expect(apiServiceMock.post).toHaveBeenCalledWith('/auth/logout', {});
    });
  });

  describe('isProUser', () => {
    it('should return false when no user is logged in', () => {
      expect(service.isProUser()).toBeFalse();
    });

    it('should return true for lifetime subscription', () => {
      const user = {
        id: '1',
        email: 'pro@example.com',
        name: 'Pro User',
        role: 'user',
        lifetimeSubscription: true,
      } as User;

      service.setCurrentUser(user);
      expect(service.isProUser()).toBeTrue();
    });

    it('should return true for active subscription', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const user = {
        id: '1',
        email: 'pro@example.com',
        name: 'Pro User',
        role: 'user',
        subscriptionStatus: 'active',
        subscriptionEndsAt: futureDate.toISOString(),
      } as User;

      service.setCurrentUser(user);
      expect(service.isProUser()).toBeTrue();
    });

    it('should return false for expired subscription', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);

      const user = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        subscriptionStatus: 'active',
        subscriptionEndsAt: pastDate.toISOString(),
      } as User;

      service.setCurrentUser(user);
      expect(service.isProUser()).toBeFalse();
    });
  });

  describe('getRemainingRequests', () => {
    it('should return free limit for non-logged-in users', () => {
      expect(service.getRemainingRequests(5)).toBe(5);
    });

    it('should return Infinity for pro users', () => {
      const user = {
        id: '1',
        email: 'pro@example.com',
        name: 'Pro User',
        role: 'user',
        lifetimeSubscription: true,
      } as User;

      service.setCurrentUser(user);
      expect(service.getRemainingRequests(5)).toBe(Number.POSITIVE_INFINITY);
    });

    it('should calculate remaining requests for free users', () => {
      const user = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        requestCount: 3,
      } as User;

      service.setCurrentUser(user);
      expect(service.getRemainingRequests(5)).toBe(2);
    });

    it('should return 0 when free limit is exceeded', () => {
      const user = {
        id: '1',
        email: 'user@example.com',
        name: 'User',
        role: 'user',
        requestCount: 10,
      } as User;

      service.setCurrentUser(user);
      expect(service.getRemainingRequests(5)).toBe(0);
    });
  });

  describe('refreshCurrentUser', () => {
    it('should refresh user successfully', async () => {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      } as User;

      apiServiceMock.get.and.resolveTo(mockUser);

      const result = await service.refreshCurrentUser();

      expect(result).toEqual(mockUser);
      expect(service.currentUser).toEqual(mockUser);
      expect(apiServiceMock.get).toHaveBeenCalledWith('/users/me');
    });

    it('should clear user on refresh failure', async () => {
      apiServiceMock.get.and.rejectWith(new Error('Unauthorized'));

      const result = await service.refreshCurrentUser();

      expect(result).toBeNull();
      expect(service.currentUser).toBeNull();
    });
  });
});
