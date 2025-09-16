import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { ResetPasswordComponent } from './reset-password';
import { AuthService } from '@cooksona/auth';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: { get: () => 'test-token' } },
          },
        },
        {
          provide: Router,
          useValue: {
            navigate: jasmine
              .createSpy('navigate')
              .and.returnValue(Promise.resolve(true)),
            navigateByUrl: jasmine
              .createSpy('navigateByUrl')
              .and.returnValue(Promise.resolve(true)),
          },
        },
        {
          provide: AuthService,
          useValue: {
            resetPassword: jasmine.createSpy('resetPassword').and.resolveTo(),
            currentUser: null,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
