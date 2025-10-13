import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnackbarComponent } from './snackbar.component';
import { SnackbarService, SnackbarMessage } from './snackbar.service';
import { Subject } from 'rxjs';

describe('SnackbarComponent', () => {
  let fixture: ComponentFixture<SnackbarComponent>;
  let comp: SnackbarComponent;
  let mockMessage$: Subject<SnackbarMessage | null>;

  beforeEach(async () => {
    mockMessage$ = new Subject<SnackbarMessage | null>();

    const mockSnackbarService = {
      message$: mockMessage$.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [SnackbarComponent],
      providers: [{ provide: SnackbarService, useValue: mockSnackbarService }],
    }).compileComponents();

    fixture = TestBed.createComponent(SnackbarComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should not display message initially', () => {
    expect(comp.msg).toBeNull();
    const compiled = fixture.nativeElement;
    expect(compiled.querySelector('[role="status"]')).toBeNull();
  });

  it('should display success message', () => {
    mockMessage$.next({ text: 'Success!', level: 'success', duration: 3000 });
    fixture.detectChanges();

    expect(comp.msg).toEqual({
      text: 'Success!',
      level: 'success',
      duration: 3000,
    });
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Success!');
  });

  it('should display error message', () => {
    mockMessage$.next({
      text: 'Error occurred',
      level: 'error',
      duration: 4000,
    });
    fixture.detectChanges();

    expect(comp.msg).toEqual({
      text: 'Error occurred',
      level: 'error',
      duration: 4000,
    });
    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Error occurred');
  });

  it('should apply correct bg class for success', () => {
    expect(comp.bgClass('success')).toBe('bg-green-50 border border-green-200');
  });

  it('should apply correct bg class for error', () => {
    expect(comp.bgClass('error')).toBe('bg-red-50 border border-red-200');
  });

  it('should apply correct bg class for warning', () => {
    expect(comp.bgClass('warning')).toBe(
      'bg-yellow-50 border border-yellow-200',
    );
  });

  it('should apply correct bg class for info', () => {
    expect(comp.bgClass('info')).toBe('bg-base-100 border border-base-200');
  });

  it('should apply correct dot class for success', () => {
    expect(comp.dotClass('success')).toBe('bg-green-500');
  });

  it('should apply correct dot class for error', () => {
    expect(comp.dotClass('error')).toBe('bg-red-500');
  });

  it('should apply correct dot class for warning', () => {
    expect(comp.dotClass('warning')).toBe('bg-yellow-500');
  });

  it('should apply correct dot class for info', () => {
    expect(comp.dotClass('info')).toBe('bg-gray-400');
  });

  it('should unsubscribe on destroy', () => {
    const subSpy = spyOn(comp['sub'], 'unsubscribe');
    comp.ngOnDestroy();
    expect(subSpy).toHaveBeenCalled();
  });
});
