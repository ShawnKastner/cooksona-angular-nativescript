import { Directive, ElementRef, HostListener, Input, OnInit } from '@angular/core';

/**
 * Directive to create skip links for keyboard navigation
 * Allows users to skip to main content or navigation
 */
@Directive({
  selector: '[appSkipLink]',
  standalone: true,
})
export class SkipLinkDirective implements OnInit {
  @Input() appSkipLink = '';

  constructor(private el: ElementRef) {}

  ngOnInit(): void {
    const element = this.el.nativeElement as HTMLElement;
    
    // Style the skip link to be visually hidden but accessible
    element.classList.add('skip-link');
  }

  @HostListener('click')
  onClick(): void {
    if (!this.appSkipLink) return;
    
    const target = document.querySelector(this.appSkipLink);
    if (target instanceof HTMLElement) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
}
