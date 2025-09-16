import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FocusTrapDirective } from './focus-trap.directive';

@Component({
  standalone: true,
  imports: [FocusTrapDirective],
  template: `
    <div appFocusTrap>
      <button id="first">First</button>
      <button id="second">Second</button>
    </div>
  `,
})
class HostComponent {}

describe('FocusTrapDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('focuses first focusable element on init', (done) => {
    setTimeout(() => {
      const first = fixture.nativeElement.querySelector(
        '#first'
      ) as HTMLElement;
      expect(document.activeElement).toBe(first);
      done();
    });
  });

  it('traps focus within container on tab and shift+tab', () => {
    const first = fixture.nativeElement.querySelector('#first') as HTMLElement;
    const second = fixture.nativeElement.querySelector(
      '#second'
    ) as HTMLElement;
    second.focus();
    const container = fixture.nativeElement.querySelector('[appfocustrap]');
    container.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    expect(document.activeElement).toBe(first);

    first.focus();
    container.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
    );
    expect(document.activeElement).toBe(second);
  });
});
