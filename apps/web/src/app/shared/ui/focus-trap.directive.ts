import { AfterViewInit, Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appFocusTrap]',
  standalone: true,
})
export class FocusTrapDirective implements AfterViewInit {
  constructor(private readonly host: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    // Delay to ensure projected content is rendered
    queueMicrotask(() => this.focusFirstElement());
  }

  private get focusables(): HTMLElement[] {
    const root = this.host.nativeElement;
    const selector = [
      'a[href]','area[href]','input:not([disabled]):not([type="hidden"])',
      'select:not([disabled])','textarea:not([disabled])','button:not([disabled])',
      '[tabindex]:not([tabindex="-1"])','[contenteditable="true"]'
    ].join(',');
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
    return nodes.filter(el => !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length));
  }

  private focusFirstElement(): void {
    const list = this.focusables;
    if (list.length > 0) {
      try { list[0].focus(); } catch {}
    } else {
      const root = this.host.nativeElement;
      root.setAttribute('tabindex', '-1');
      try { root.focus(); } catch {}
    }
  }

  @HostListener('keydown', ['$event'])
  onKeydown(ev: KeyboardEvent): void {
    if (ev.key !== 'Tab') return;
    const list = this.focusables;
    if (list.length === 0) {
      ev.preventDefault();
      return;
    }
    const active = document.activeElement as HTMLElement | null;
    const idx = active ? list.indexOf(active) : -1;
    const lastIndex = list.length - 1;
    if (ev.shiftKey) {
      // Shift+Tab: go backwards
      if (idx <= 0) {
        list[lastIndex].focus();
        ev.preventDefault();
      }
    } else {
      // Tab: go forward
      if (idx === lastIndex) {
        list[0].focus();
        ev.preventDefault();
      }
    }
  }
}

