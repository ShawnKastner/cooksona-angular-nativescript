import {
  Directive,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[svgInject]',
  standalone: true,
})
export class SvgInjectDirective implements OnInit, OnDestroy {
  /** Dein SVG als String (aus icons.ts) */
  @Input('svgInject') svg!: string;

  /** Optional: Größe überschreiben (z. B. 24 | '2rem') */
  @Input() size?: number | string;

  /** Optional: stroke-width überschreiben (z. B. 2) */
  @Input() strokeWidth?: number | string;

  /** Falls true, entfernt width/height aus dem String, damit CSS (Tailwind) greift */
  @Input() stripInlineSize = true;

  private observer?: MutationObserver;
  private svgEl?: SVGElement;

  constructor(
    private el: ElementRef<HTMLElement>,
    private r: Renderer2,
  ) {}

  ngOnInit() {
    if (!this.svg) return;

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.svg, 'image/svg+xml');
    const svgEl = (this.svgEl = doc.documentElement as unknown as SVGElement);

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
    // Zu Beginn: Klassen des Hosts auf das SVG spiegeln
    this.syncSvgClasses();
    Array.from(host.attributes).forEach((attr) => {
      if (attr.name.startsWith('aria-') || attr.name === 'role') {
        svgEl.setAttribute(attr.name, attr.value);
      }
    });

    // Render SVG inside host to keep Angular in control of lifecycle
    // Clear host children first to avoid duplicates on re-render
    while (host.firstChild) {
      this.r.removeChild(host, host.firstChild);
    }
    this.r.appendChild(host, svgEl);

    // Beobachte künftige Klassenänderungen am Host und spiegle auf das SVG
    this.observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          this.syncSvgClasses();
        }
      }
    });
    this.observer.observe(host, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.observer = undefined;
  }

  private syncSvgClasses(): void {
    const host = this.el.nativeElement;
    const svg = this.svgEl;
    if (!svg) return;
    const hostClasses = host.className.trim();
    if (hostClasses) {
      svg.setAttribute('class', hostClasses);
    } else {
      svg.removeAttribute('class');
    }
  }
}
