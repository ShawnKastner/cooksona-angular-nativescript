import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { MealPlannerFormComponent } from './meal-planner-form.component';

describe('MealPlannerFormComponent', () => {
  let fixture: ComponentFixture<MealPlannerFormComponent>;
  let comp: MealPlannerFormComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MealPlannerFormComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(MealPlannerFormComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('initializes with defaults', () => {
    const v = comp.form.getRawValue();
    expect(v.people).toBe(2);
    expect(v.planDays).toBe(7);
    expect(v.meals.breakfast).toBeTrue();
  });

  it('enforces free plan limits when isProUser=false', () => {
    comp.form.controls.planDays.setValue(10);
    comp.isProUser = false;
    const change = new SimpleChange(true, false, false);
    comp.ngOnChanges({
      isProUser: change,
    });
    expect(comp.form.controls.planDays.value).toBe(3);
    expect(comp.form.controls.enableNutritionAnalysis.disabled).toBeTrue();
  });

  it('emits submitPlan with form value on submit', () => {
    const spy = jasmine.createSpy('submit');
    comp.submitPlan.subscribe(spy);
    comp.submit();
    expect(spy).toHaveBeenCalled();
  });
});
