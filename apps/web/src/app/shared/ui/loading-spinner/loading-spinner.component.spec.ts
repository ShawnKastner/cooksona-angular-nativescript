import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';

describe('LoadingSpinnerComponent', () => {
  let fixture: ComponentFixture<LoadingSpinnerComponent>;
  let comp: LoadingSpinnerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should display label and subLabel in non-compact mode', () => {
    comp.label = 'Loading...';
    comp.subLabel = 'Please wait';
    comp.compact = false;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Loading...');
    expect(compiled.textContent).toContain('Please wait');
  });

  it('should not display label and subLabel in compact mode', () => {
    comp.label = 'Loading...';
    comp.subLabel = 'Please wait';
    comp.compact = true;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).not.toContain('Loading...');
    expect(compiled.textContent).not.toContain('Please wait');
  });

  it('should apply compact classes when compact is true', () => {
    comp.compact = true;
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('[role="status"]');
    expect(spinner.classList.contains('p-6')).toBeTrue();
    
    const spinnerRing = fixture.nativeElement.querySelector('.animate-spin');
    expect(spinnerRing.classList.contains('w-12')).toBeTrue();
    expect(spinnerRing.classList.contains('h-12')).toBeTrue();
  });

  it('should apply non-compact classes when compact is false', () => {
    comp.compact = false;
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('[role="status"]');
    expect(spinner.classList.contains('p-12')).toBeTrue();
    
    const spinnerRing = fixture.nativeElement.querySelector('.animate-spin');
    expect(spinnerRing.classList.contains('w-20')).toBeTrue();
    expect(spinnerRing.classList.contains('h-20')).toBeTrue();
  });

  it('should not have border when withOutBorder is true', () => {
    comp.withOutBorder = true;
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('[role="status"]');
    expect(spinner.classList.contains('border-2')).toBeFalse();
  });

  it('should have border when withOutBorder is false', () => {
    comp.withOutBorder = false;
    fixture.detectChanges();

    const spinner = fixture.nativeElement.querySelector('[role="status"]');
    expect(spinner.classList.contains('border-2')).toBeTrue();
  });
});
