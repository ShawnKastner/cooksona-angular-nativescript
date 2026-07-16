import { Directive, ElementRef, HostListener, OnInit, Renderer2 } from '@angular/core';

/**
 * Directive to add visible focus indicators for keyboard navigation
 * Ensures WCAG 2.1 AA compliance for focus visibility
 */
@Directive({
  selector: '[appFocusVisible]',
  standalone: true,
})
export class FocusVisibleDirective implements OnInit {
  private isKeyboard = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit(): void {
    // Track keyboard usage
    document.addEventListener('keydown', () => {
      this.isKeyboard = true;
    });

    document.addEventListener('mousedown', () => {
      this.isKeyboard = false;
    });
  }

  @HostListener('focus')
  onFocus(): void {
    if (this.isKeyboard) {
      this.renderer.addClass(this.el.nativeElement, 'focus-visible');
    }
  }

  @HostListener('blur')
  onBlur(): void {
    this.renderer.removeClass(this.el.nativeElement, 'focus-visible');
  }
}
