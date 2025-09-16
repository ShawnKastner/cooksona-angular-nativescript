import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeTransformModalComponent } from './recipe-transform-modal.component';
import { ApiService } from '@cooksona/api';

class ApiStub {}

describe('RecipeTransformModalComponent', () => {
  let fixture: ComponentFixture<RecipeTransformModalComponent>;
  let comp: RecipeTransformModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeTransformModalComponent],
      providers: [{ provide: ApiService, useClass: ApiStub }],
    }).compileComponents();
    fixture = TestBed.createComponent(RecipeTransformModalComponent);
    comp = fixture.componentInstance;
    comp.open = true;
    comp.recipe = {
      id: 'r1',
      name: 'Test',
      ingredients: [],
      instructions: [],
    } as any;
    fixture.detectChanges();
  });

  it('emits close on Escape', () => {
    const spy = jasmine.createSpy('close');
    comp.close.subscribe(spy);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(spy).toHaveBeenCalled();
  });
});
