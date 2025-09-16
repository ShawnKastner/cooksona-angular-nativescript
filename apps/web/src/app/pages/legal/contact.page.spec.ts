import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContactPage } from './contact.page';
import { AuthService } from '@cooksona/auth';
import { ContactApiService } from '@cooksona/api';
import { SnackbarService } from '../../shared/ui/snackbar.service';

class AuthStub {
  currentUser: any = null;
}
class ContactApiStub {
  createContactRequest = jasmine
    .createSpy('createContactRequest')
    .and.resolveTo({});
}
class SnackbarStub {
  success = jasmine.createSpy('success');
  error = jasmine.createSpy('error');
}

describe('ContactPage', () => {
  let fixture: ComponentFixture<ContactPage>;
  let comp: ContactPage;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContactPage],
      providers: [
        { provide: AuthService, useClass: AuthStub },
        { provide: ContactApiService, useClass: ContactApiStub },
        { provide: SnackbarService, useClass: SnackbarStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactPage);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows error when message is empty', async () => {
    const snackbar = TestBed.inject(SnackbarService) as any;
    await comp.handleSubmit();
    expect(snackbar.error).toHaveBeenCalled();
  });

  it('submits request for guest with email', async () => {
    const api = TestBed.inject(ContactApiService) as any;
    comp.form.setValue({
      requestType: 'feature',
      message: 'Hallo',
      email: 'a@b.c',
    });
    await comp.handleSubmit();
    expect(api.createContactRequest).toHaveBeenCalled();
  });

  it('submits request for logged-in user without email', async () => {
    const auth = TestBed.inject(AuthService) as any;
    auth.currentUser = { id: 'u1' };
    const api = TestBed.inject(ContactApiService) as any;
    comp.form.setValue({ requestType: 'support', message: 'Hi', email: '' });
    await comp.handleSubmit();
    const args = api.createContactRequest.calls.mostRecent().args[0];
    expect(args.userId).toBe('u1');
  });
});
