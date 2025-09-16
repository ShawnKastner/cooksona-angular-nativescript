import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RecipeDetailModalComponent } from './recipe-detail-modal.component';
import { AuthService } from '@cooksona/auth';

class AuthStub {
  isProUser() {
    return true;
  }
}

describe('RecipeDetailModalComponent', () => {
  let fixture: ComponentFixture<RecipeDetailModalComponent>;
  let comp: RecipeDetailModalComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecipeDetailModalComponent],
      providers: [{ provide: AuthService, useClass: AuthStub }],
    }).compileComponents();
    fixture = TestBed.createComponent(RecipeDetailModalComponent);
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
