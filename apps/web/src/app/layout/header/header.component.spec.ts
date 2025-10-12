import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { Router } from '@angular/router';
import { AuthService } from '@cooksona/auth';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { BehaviorSubject } from 'rxjs';

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let comp: HeaderComponent;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSnackbarService: jasmine.SpyObj<SnackbarService>;
  let currentUserSubject: BehaviorSubject<any>;

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject(null);
    
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout']);
    mockSnackbarService = jasmine.createSpyObj('SnackbarService', ['error', 'success']);
    
    Object.defineProperty(mockAuthService, 'currentUser$', {
      get: () => currentUserSubject.asObservable(),
    });

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService },
        { provide: SnackbarService, useValue: mockSnackbarService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should start with dropdown closed', () => {
    expect(comp.isDropdownOpen()).toBeFalse();
  });

  it('should toggle dropdown', () => {
    expect(comp.isDropdownOpen()).toBeFalse();
    
    comp.toggleDropdown();
    expect(comp.isDropdownOpen()).toBeTrue();
    
    comp.toggleDropdown();
    expect(comp.isDropdownOpen()).toBeFalse();
  });

  it('should close dropdown', () => {
    comp.isDropdownOpen.set(true);
    expect(comp.isDropdownOpen()).toBeTrue();
    
    comp.closeDropdown();
    expect(comp.isDropdownOpen()).toBeFalse();
  });

  it('should navigate to path and close dropdown', async () => {
    comp.isDropdownOpen.set(true);
    mockRouter.navigateByUrl.and.resolveTo(true);

    await comp.navigateTo('/profile');

    expect(comp.isDropdownOpen()).toBeFalse();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/profile');
  });

  it('should logout successfully', async () => {
    mockAuthService.logout.and.resolveTo();
    mockRouter.navigateByUrl.and.resolveTo(true);

    await comp.logout();

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(comp.isDropdownOpen()).toBeFalse();
  });

  it('should show error on logout failure', async () => {
    mockAuthService.logout.and.rejectWith({ message: 'Logout failed' });
    mockRouter.navigateByUrl.and.resolveTo(true);

    await comp.logout();

    expect(mockSnackbarService.error).toHaveBeenCalled();
  });

  it('should close dropdown when clicking outside', () => {
    comp.isDropdownOpen.set(true);
    
    const outsideElement = document.createElement('div');
    document.body.appendChild(outsideElement);
    
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: outsideElement });
    
    comp.onDocClick(event);
    
    expect(comp.isDropdownOpen()).toBeFalse();
    
    document.body.removeChild(outsideElement);
  });

  it('should not close dropdown when clicking inside', () => {
    comp.isDropdownOpen.set(true);
    
    const event = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(event, 'target', { value: fixture.nativeElement });
    
    comp.onDocClick(event);
    
    expect(comp.isDropdownOpen()).toBeTrue();
  });
});
