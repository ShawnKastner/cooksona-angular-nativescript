import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SvgInjectDirective } from './svg-inject.directive';

const TEST_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>';

@Component({
  standalone: true,
  imports: [SvgInjectDirective],
  template: `
    @if (show) {
    <span id="icon" [svgInject]="svg" class="w-5 h-5"></span>
    }
  `,
})
class HostComponent {
  show = true;
  svg = TEST_SVG;
}

describe('SvgInjectDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('injects exactly one SVG into host', () => {
    const host = fixture.nativeElement.querySelector('#icon') as HTMLElement;
    expect(host.querySelectorAll('svg').length).toBe(1);
  });

  it('does not duplicate SVGs on toggle re-render', () => {
    const comp = fixture.componentInstance;
    comp.show = false;
    fixture.detectChanges();
    comp.show = true;
    fixture.detectChanges();
    const host = fixture.nativeElement.querySelector('#icon') as HTMLElement;
    expect(host.querySelectorAll('svg').length).toBe(1);
  });
});
