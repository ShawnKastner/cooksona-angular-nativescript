import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressRingComponent } from './progress-ring.component';

describe('ProgressRingComponent', () => {
  let fixture: ComponentFixture<ProgressRingComponent>;
  let comp: ProgressRingComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressRingComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ProgressRingComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should compute radius correctly', () => {
    expect(comp.radius()).toBe(50);
  });

  it('should compute circumference correctly', () => {
    const expected = 2 * Math.PI * 50;
    expect(comp.circumference()).toBe(expected);
  });

  it('should compute offset for 0% progress', () => {
    fixture.componentRef.setInput('progress', 0);
    const expected = comp.circumference();
    expect(comp.offset()).toBe(expected);
  });

  it('should compute offset for 50% progress', () => {
    fixture.componentRef.setInput('progress', 50);
    const expected = comp.circumference() - (50 / 100) * comp.circumference();
    expect(comp.offset()).toBe(expected);
  });

  it('should compute offset for 100% progress', () => {
    fixture.componentRef.setInput('progress', 100);
    const expected = comp.circumference() - (100 / 100) * comp.circumference();
    expect(comp.offset()).toBe(expected);
  });

  it('should display value and total', () => {
    fixture.componentRef.setInput('value', 1500);
    fixture.componentRef.setInput('total', 2000);
    fixture.componentRef.setInput('unit', 'kcal');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('1500');
    expect(compiled.textContent).toContain('2000');
    expect(compiled.textContent).toContain('kcal');
  });

  it('should display label', () => {
    fixture.componentRef.setInput('label', 'Calories');
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Calories');
  });

  it('should apply custom color class', () => {
    fixture.componentRef.setInput('colorClass', 'text-success');
    fixture.detectChanges();

    const progressCircle = fixture.nativeElement.querySelectorAll('circle')[1];
    expect(progressCircle.classList.contains('text-success')).toBeTrue();
  });
});
