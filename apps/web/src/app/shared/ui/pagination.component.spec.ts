import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginationComponent } from './pagination.component';

describe('PaginationComponent', () => {
  let fixture: ComponentFixture<PaginationComponent>;
  let comp: PaginationComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(PaginationComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should disable prev button on first page', () => {
    comp.page = 1;
    comp.totalPages = 5;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const prevButton = buttons[0];
    expect(prevButton.disabled).toBeTrue();
  });

  it('should enable prev button when not on first page', () => {
    comp.page = 2;
    comp.totalPages = 5;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const prevButton = buttons[0];
    expect(prevButton.disabled).toBeFalse();
  });

  it('should disable next button on last page', () => {
    comp.page = 5;
    comp.totalPages = 5;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const nextButton = buttons[1];
    expect(nextButton.disabled).toBeTrue();
  });

  it('should enable next button when not on last page', () => {
    comp.page = 2;
    comp.totalPages = 5;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('button');
    const nextButton = buttons[1];
    expect(nextButton.disabled).toBeFalse();
  });

  it('should emit pageChange on prev click', () => {
    comp.page = 3;
    comp.totalPages = 5;
    const spy = jasmine.createSpy('pageChange');
    comp.pageChange.subscribe(spy);

    comp.prev();

    expect(spy).toHaveBeenCalledWith(2);
  });

  it('should emit pageChange on next click', () => {
    comp.page = 2;
    comp.totalPages = 5;
    const spy = jasmine.createSpy('pageChange');
    comp.pageChange.subscribe(spy);

    comp.next();

    expect(spy).toHaveBeenCalledWith(3);
  });

  it('should not emit pageChange on prev when on first page', () => {
    comp.page = 1;
    comp.totalPages = 5;
    const spy = jasmine.createSpy('pageChange');
    comp.pageChange.subscribe(spy);

    comp.prev();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should not emit pageChange on next when on last page', () => {
    comp.page = 5;
    comp.totalPages = 5;
    const spy = jasmine.createSpy('pageChange');
    comp.pageChange.subscribe(spy);

    comp.next();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should display current page and total pages', () => {
    comp.page = 3;
    comp.totalPages = 10;
    fixture.detectChanges();

    const compiled = fixture.nativeElement;
    expect(compiled.textContent).toContain('Seite 3 von 10');
  });
});
