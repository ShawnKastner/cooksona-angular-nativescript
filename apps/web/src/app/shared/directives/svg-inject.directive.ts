import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[svgInject]',
  standalone: true,
})
export class SvgInjectDirective implements OnInit {
  /** Dein SVG als String (aus icons.ts) */
  @Input('svgInject') svg!: string;

  /** Optional: Größe überschreiben (z. B. 24 | '2rem') */
  @Input() size?: number | string;

  /** Optional: stroke-width überschreiben (z. B. 2) */
  @Input() strokeWidth?: number | string;

  /** Falls true, entfernt width/height aus dem String, damit CSS (Tailwind) greift */
  @Input() stripInlineSize = true;

  constructor(private el: ElementRef<HTMLElement>, private r: Renderer2) {}

  ngOnInit() {
    if (!this.svg) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.svg, 'image/svg+xml');
    const svgEl = doc.documentElement as unknown as SVGElement;

    // optional: width/height aus dem String entfernen, damit .h-8 .w-8 wirken
    if (this.stripInlineSize) {
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
    }

    // optionale Overrides anwenden
    if (this.size != null) {
      svgEl.setAttribute('width', String(this.size));
      svgEl.setAttribute('height', String(this.size));
    }
    if (this.strokeWidth != null) {
      svgEl.setAttribute('stroke-width', String(this.strokeWidth));
    }

    // Klassen & a11y-Attribute vom Host aufs SVG übertragen
    const host = this.el.nativeElement;
    if (host.className) {
      // bestehende Klassen des SVG beibehalten + Host-Klassen mergen
      const merged = [svgEl.getAttribute('class') ?? '', host.className]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (merged) svgEl.setAttribute('class', merged);
    }
    Array.from(host.attributes).forEach((attr) => {
      if (attr.name.startsWith('aria-') || attr.name === 'role') {
        svgEl.setAttribute(attr.name, attr.value);
      }
    });

    // Host durch echtes <svg> ersetzen
    const parent = host.parentNode;
    if (parent) {
      this.r.insertBefore(parent, svgEl, host);
      this.r.removeChild(parent, host);
    }
  }
}
