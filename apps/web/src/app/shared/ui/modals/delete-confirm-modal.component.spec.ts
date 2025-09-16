import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeleteConfirmModalComponent } from './delete-confirm-modal.component';

describe('DeleteConfirmModalComponent', () => {
  let fixture: ComponentFixture<DeleteConfirmModalComponent>;
  let comp: DeleteConfirmModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeleteConfirmModalComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(DeleteConfirmModalComponent);
    comp = fixture.componentInstance;
    comp.open = true;
    fixture.detectChanges();
  });

  it('emits cancel on Escape', () => {
    let canceled = false;
    comp.cancel.subscribe(() => (canceled = true));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(canceled).toBeTrue();
  });

  it('has aria-labelledby attribute when open', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
  });
});
