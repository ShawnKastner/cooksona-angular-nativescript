import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddToCollectionModalComponent } from './add-to-collection-modal.component';
import { CookbookApiService } from '@cooksona/api';
import { SnackbarService } from '../../snackbar/snackbar.service';
import { Recipe, CookbookCollection } from '@cooksona/models/recipe.models';

describe('AddToCollectionModalComponent', () => {
  let fixture: ComponentFixture<AddToCollectionModalComponent>;
  let comp: AddToCollectionModalComponent;
  let mockCookbookApi: jasmine.SpyObj<CookbookApiService>;
  let mockSnackbar: jasmine.SpyObj<SnackbarService>;

  beforeEach(async () => {
    mockCookbookApi = jasmine.createSpyObj('CookbookApiService', [
      'getCollectionsForRecipe',
      'suggestRecipeCollections',
    ]);
    mockSnackbar = jasmine.createSpyObj('SnackbarService', [
      'error',
      'success',
    ]);

    await TestBed.configureTestingModule({
      imports: [AddToCollectionModalComponent],
      providers: [
        { provide: CookbookApiService, useValue: mockCookbookApi },
        { provide: SnackbarService, useValue: mockSnackbar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddToCollectionModalComponent);
    comp = fixture.componentInstance;

    mockCookbookApi.getCollectionsForRecipe.and.resolveTo([]);
    mockCookbookApi.suggestRecipeCollections.and.resolveTo([]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should check if collection is selected', () => {
    comp.selectedIds.set(new Set(['1', '2']));

    expect(comp.isSelected('1')).toBeTrue();
    expect(comp.isSelected('3')).toBeFalse();
  });

  it('should toggle collection selection', () => {
    comp.selectedIds.set(new Set(['1']));

    comp.toggle('1');
    expect(comp.isSelected('1')).toBeFalse();

    comp.toggle('2');
    expect(comp.isSelected('2')).toBeTrue();
  });

  it('should add suggestion to existing collection', () => {
    const existingCollection: CookbookCollection = {
      id: 'col-1',
      name: 'Favorites',
    } as CookbookCollection;

    comp.cookbookCollections.set([existingCollection]);
    comp.selectedIds.set(new Set());

    comp.addSuggestion('Favorites');

    expect(comp.isSelected('col-1')).toBeTrue();
  });

  it('should create new collection from suggestion', () => {
    comp.cookbookCollections.set([]);
    comp.selectedIds.set(new Set());

    comp.addSuggestion('New Collection');

    expect(comp.newCollectionName()).toBe('');
    expect(comp.isSelected('new_New Collection')).toBeTrue();
    expect(comp.cookbookCollections().length).toBe(1);
    expect(comp.cookbookCollections()[0].name).toBe('New Collection');
  });

  it('should create and select new collection', () => {
    comp.newCollectionName.set('My Collection');
    comp.cookbookCollections.set([]);

    comp.createAndSelect();

    expect(comp.isSelected('new_My Collection')).toBeTrue();
    expect(comp.newCollectionName()).toBe('');
    expect(comp.cookbookCollections().length).toBe(1);
    expect(comp.cookbookCollections()[0].name).toBe('My Collection');
  });

  it('should not create duplicate collection', () => {
    const existing: CookbookCollection = {
      id: '1',
      name: 'Existing',
    } as CookbookCollection;

    comp.cookbookCollections.set([existing]);
    comp.newCollectionName.set('Existing');

    comp.createAndSelect();

    expect(comp.error()).toBe(
      'Eine Sammlung mit diesem Namen existiert bereits.',
    );
    expect(comp.cookbookCollections().length).toBe(1);
  });

  it('should emit save with selected collections', () => {
    const recipe: Recipe = {
      id: 'recipe-1',
      name: 'Test Recipe',
    } as Recipe;

    comp.recipe = recipe;
    comp.selectedIds.set(new Set(['col-1', 'col-2']));

    const saveSpy = jasmine.createSpy('save');
    comp.save.subscribe(saveSpy);

    comp.saveSelections();

    expect(saveSpy).toHaveBeenCalledWith({
      recipe,
      selectedIds: jasmine.arrayContaining(['col-1', 'col-2']),
      newCollections: [],
    });
  });

  it('should emit save with new collections', () => {
    const recipe: Recipe = {
      id: 'recipe-1',
      name: 'Test Recipe',
    } as Recipe;

    comp.recipe = recipe;
    comp.selectedIds.set(new Set(['new_New Collection']));

    const saveSpy = jasmine.createSpy('save');
    comp.save.subscribe(saveSpy);

    comp.saveSelections();

    expect(saveSpy).toHaveBeenCalledWith({
      recipe,
      selectedIds: ['New Collection'],
      newCollections: [{ name: 'New Collection' }],
    });
  });

  it('should emit close on escape key', () => {
    comp.open = true;
    const closeSpy = jasmine.createSpy('close');
    comp.close.subscribe(closeSpy);

    comp.onEsc();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should load collections for recipe on open', async () => {
    const recipe: Recipe = {
      id: 'recipe-1',
      name: 'Test Recipe',
    } as Recipe;

    const collections: CookbookCollection[] = [
      { id: '1', name: 'Collection 1' } as CookbookCollection,
      { id: '2', name: 'Collection 2' } as CookbookCollection,
    ];

    mockCookbookApi.getCollectionsForRecipe.and.resolveTo(collections);
    mockCookbookApi.suggestRecipeCollections.and.resolveTo([
      'Suggested 1',
      'Suggested 2',
    ]);

    comp.recipe = recipe;
    comp.open = true;
    comp.collections = collections;
    comp.ngOnChanges({
      open: {
        currentValue: true,
        previousValue: false,
        firstChange: false,
        isFirstChange: () => false,
      },
      recipe: {
        currentValue: recipe,
        previousValue: null,
        firstChange: false,
        isFirstChange: () => false,
      },
    });

    await fixture.whenStable();

    expect(mockCookbookApi.getCollectionsForRecipe).toHaveBeenCalledWith(
      'recipe-1',
    );
  });
});
