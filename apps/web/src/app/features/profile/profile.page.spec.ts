import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { ProfileComponent } from './profile.page';
import { AuthService } from '@cooksona/auth';
import { ContactApiService, ApiService } from '@cooksona/api';
import { SnackbarService } from '../../shared/ui/snackbar.service';
import { User } from '@cooksona/models/user.models';

class AuthStub {
  private subj = new BehaviorSubject<User | null>({
    id: 'u1',
    name: 'Max',
    email: 'max@example.com',
  });
  currentUser$ = this.subj.asObservable();
  get currentUser() {
    return this.subj.value;
  }
  updateProfile = jasmine
    .createSpy<() => Promise<void>>('updateProfile')
    .and.resolveTo();
}
class ApiStub {}
class ContactApiStub {}
class SnackbarStub {
  success = jasmine.createSpy('success');
  error = jasmine.createSpy('error');
}

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let comp: ProfileComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        { provide: AuthService, useClass: AuthStub },
        { provide: ApiService, useClass: ApiStub },
        { provide: ContactApiService, useClass: ContactApiStub },
        { provide: SnackbarService, useClass: SnackbarStub },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProfileComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates component', () => {
    expect(comp).toBeTruthy();
  });

  it('submits profile, calls updateProfile and shows success snackbar', async () => {
    const auth = TestBed.inject(AuthService) as unknown as AuthStub;
    const snackbar = TestBed.inject(SnackbarService) as unknown as SnackbarStub;
    comp.isEditing = true;
    comp.form.patchValue({ name: 'Moritz', email: 'm@example.com' });
    await comp.handleSubmit();
    expect(auth.updateProfile).toHaveBeenCalled();
    expect(snackbar.success).toHaveBeenCalled();
    expect(comp.isSaving).toBeFalse();
  });
});
