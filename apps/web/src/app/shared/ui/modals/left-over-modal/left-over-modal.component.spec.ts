import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LeftOverModalComponent } from './left-over-modal.component';
import { ApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';

class ApiStub {}
class AuthStub {
  isProUser() {
    return true;
  }
  getRemainingRequests() {
    return 10;
  }
}

describe('LeftOverModalComponent', () => {
  let fixture: ComponentFixture<LeftOverModalComponent>;
  let comp: LeftOverModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeftOverModalComponent],
      providers: [
        { provide: ApiService, useClass: ApiStub },
        { provide: AuthService, useClass: AuthStub },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(LeftOverModalComponent);
    comp = fixture.componentInstance;
    comp.open = true;
    fixture.detectChanges();
  });

  it('emits close on Escape', () => {
    const spy = jasmine.createSpy('close');
    comp.close.subscribe(spy);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(spy).toHaveBeenCalled();
  });
});
