import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';

export interface SeoProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
}

@Component({
  selector: 'app-seo',
  standalone: true,
  imports: [CommonModule],
  template: '',
})
export class SeoComponent implements OnChanges, SeoProps {
  @Input() title!: string;
  @Input() description!: string;
  @Input() keywords?: string;
  @Input() image?: string;

  constructor(private readonly titleSvc: Title, private readonly meta: Meta) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['title'] ||
      changes['description'] ||
      changes['keywords'] ||
      changes['image']
    ) {
      this.apply();
    }
  }

  private apply(): void {
    // Title
    this.titleSvc.setTitle(this.title);

    // Basic meta
    this.meta.updateTag({ name: 'description', content: this.description });
    if (this.keywords) {
      this.meta.updateTag({ name: 'keywords', content: this.keywords });
    }

    // Open Graph
    this.meta.updateTag({ property: 'og:title', content: this.title });
    this.meta.updateTag({
      property: 'og:description',
      content: this.description,
    });
    if (this.image) {
      this.meta.updateTag({ property: 'og:image', content: this.image });
    }
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    // Twitter
    this.meta.updateTag({
      name: 'twitter:card',
      content: 'summary_large_image',
    });
    this.meta.updateTag({ name: 'twitter:title', content: this.title });
    this.meta.updateTag({
      name: 'twitter:description',
      content: this.description,
    });
    if (this.image) {
      this.meta.updateTag({ name: 'twitter:image', content: this.image });
    }
  }
}
