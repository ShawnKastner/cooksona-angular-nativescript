import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('FooterComponent', () => {
  let fixture: ComponentFixture<FooterComponent>;
  let comp: FooterComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent, RouterTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    comp = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(comp).toBeTruthy();
  });

  it('should start with cookie settings closed', () => {
    expect(comp.showCookieSettings()).toBeFalse();
  });

  it('should open cookie settings', () => {
    comp.openCookieSettings();
    expect(comp.showCookieSettings()).toBeTrue();
  });

  it('should close cookie settings', () => {
    comp.showCookieSettings.set(true);
    expect(comp.showCookieSettings()).toBeTrue();
    
    comp.closeCookieSettings();
    expect(comp.showCookieSettings()).toBeFalse();
  });

  it('should toggle cookie settings on open then close', () => {
    expect(comp.showCookieSettings()).toBeFalse();
    
    comp.openCookieSettings();
    expect(comp.showCookieSettings()).toBeTrue();
    
    comp.closeCookieSettings();
    expect(comp.showCookieSettings()).toBeFalse();
  });
});
