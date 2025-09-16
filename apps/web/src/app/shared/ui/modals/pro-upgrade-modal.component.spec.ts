import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProUpgradeModalComponent } from './pro-upgrade-modal.component';
import { ApiService } from '@cooksona/api';
import { AuthService } from '@cooksona/auth';

class ApiStub {}
class AuthStub {}

describe('ProUpgradeModalComponent', () => {
  let fixture: ComponentFixture<ProUpgradeModalComponent>;
  let comp: ProUpgradeModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProUpgradeModalComponent],
      providers: [
        { provide: ApiService, useClass: ApiStub },
        { provide: AuthService, useClass: AuthStub },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ProUpgradeModalComponent);
    comp = fixture.componentInstance;
    comp.open = true;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(comp).toBeTruthy();
  });
});
