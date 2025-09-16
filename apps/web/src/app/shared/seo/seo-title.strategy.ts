import { Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly suffix = 'CookSona';

  constructor(private readonly title: Title, private readonly meta: Meta) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot): void {
    const built = this.buildTitle(routerState);
    if (built) {
      const final = built.includes(this.suffix)
        ? built
        : `${built} – ${this.suffix}`;
      this.title.setTitle(final);
    } else {
      this.title.setTitle(this.suffix);
    }

    // Update meta tags from deepest active route data if provided
    const deepest = this.getDeepestData(routerState);
    if (deepest) {
      const description = deepest['description'] as string | undefined;
      const keywords = deepest['keywords'] as string | undefined;
      const image = deepest['image'] as string | undefined;

      if (description) {
        this.meta.updateTag({ name: 'description', content: description });
        this.meta.updateTag({ property: 'og:description', content: description });
        this.meta.updateTag({ name: 'twitter:description', content: description });
      }
      if (keywords) {
        this.meta.updateTag({ name: 'keywords', content: keywords });
      }
      if (built) {
        const final = built.includes(this.suffix)
          ? built
          : `${built} – ${this.suffix}`;
        this.meta.updateTag({ property: 'og:title', content: final });
        this.meta.updateTag({ name: 'twitter:title', content: final });
      }
      if (image) {
        this.meta.updateTag({ property: 'og:image', content: image });
        this.meta.updateTag({ name: 'twitter:image', content: image });
        this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
      }
      this.meta.updateTag({ property: 'og:type', content: 'website' });
    }
  }

  private getDeepestData(state: RouterStateSnapshot): Record<string, any> | null {
    let route: any = state.root;
    let data: Record<string, any> | null = null;
    while (route.firstChild) {
      route = route.firstChild;
      if (route.data) data = route.data;
    }
    return data;
  }
}
