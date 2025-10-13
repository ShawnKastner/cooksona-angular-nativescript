import { TestBed } from '@angular/core/testing';
import { ApplicationSettings } from '@nativescript/core';
import { BehaviorSubject } from 'rxjs';
import { MobileTokenService } from './mobile-token.service';
import { ApiService } from '@cooksona/api';

describe('MobileTokenService', () => {
  let service: MobileTokenService;
  let apiServiceMock: jasmine.SpyObj<ApiService>;
  let tokensSubject: BehaviorSubject<any>;

  beforeEach(() => {
    tokensSubject = new BehaviorSubject<any>(null);

    apiServiceMock = jasmine.createSpyObj('ApiService', ['setTokens'], {
      tokens$: tokensSubject.asObservable(),
    });

    TestBed.configureTestingModule({
      providers: [
        MobileTokenService,
        { provide: ApiService, useValue: apiServiceMock },
      ],
    });

    // Clear any existing tokens
    ApplicationSettings.remove('auth.tokens.v1');

    service = TestBed.inject(MobileTokenService);
  });

  afterEach(() => {
    service.ngOnDestroy();
    ApplicationSettings.remove('auth.tokens.v1');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('hydrate', () => {
    it('should return false when no tokens are stored', () => {
      const result = service.hydrate();
      expect(result).toBeFalse();
      expect(apiServiceMock.setTokens).not.toHaveBeenCalled();
    });

    it('should restore tokens from storage', () => {
      const tokens = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        csrfToken: 'csrf-789',
      };
      ApplicationSettings.setString('auth.tokens.v1', JSON.stringify(tokens));

      const result = service.hydrate();

      expect(result).toBeTrue();
      expect(apiServiceMock.setTokens).toHaveBeenCalledWith(tokens);
    });

    it('should clear storage on corrupt JSON', () => {
      ApplicationSettings.setString('auth.tokens.v1', 'invalid-json{');

      const result = service.hydrate();

      expect(result).toBeFalse();
      expect(ApplicationSettings.getString('auth.tokens.v1')).toBeUndefined();
    });
  });

  describe('clear', () => {
    it('should remove tokens from storage', () => {
      const tokens = {
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
        csrfToken: 'csrf-789',
      };
      ApplicationSettings.setString('auth.tokens.v1', JSON.stringify(tokens));

      service.clear();

      expect(ApplicationSettings.getString('auth.tokens.v1')).toBeUndefined();
    });
  });

  describe('token persistence', () => {
    it('should persist tokens when tokens$ emits', (done) => {
      const tokens = {
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
        csrfToken: 'new-csrf',
      };

      tokensSubject.next(tokens);

      // Wait for async subscription to process
      setTimeout(() => {
        const stored = ApplicationSettings.getString('auth.tokens.v1');
        expect(stored).toBeDefined();
        expect(JSON.parse(stored!)).toEqual(tokens);
        done();
      }, 100);
    });

    it('should remove tokens when all tokens are null', (done) => {
      // First set some tokens
      ApplicationSettings.setString(
        'auth.tokens.v1',
        JSON.stringify({
          accessToken: 'test',
          refreshToken: 'test',
          csrfToken: 'test',
        }),
      );

      const allNull = {
        accessToken: null,
        refreshToken: null,
        csrfToken: null,
      };

      tokensSubject.next(allNull);

      // Wait for async subscription to process
      setTimeout(() => {
        expect(ApplicationSettings.getString('auth.tokens.v1')).toBeUndefined();
        done();
      }, 100);
    });
  });
});
