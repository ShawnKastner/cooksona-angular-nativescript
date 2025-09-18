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
    const deepest = this.getDeepestData(routerState);
    const built =
      this.buildTitle(routerState) ??
      (deepest?.['title'] as string | undefined);
    const finalTitle = this.resolveTitle(built);

    this.title.setTitle(finalTitle);
    this.meta.updateTag({ property: 'og:title', content: finalTitle });
    this.meta.updateTag({ name: 'twitter:title', content: finalTitle });
    this.meta.updateTag({ property: 'og:type', content: 'website' });

    if (!deepest) {
      return;
    }

    const description = deepest['description'] as string | undefined;
    const keywords = deepest['keywords'] as string | undefined;
    const image = deepest['image'] as string | undefined;

    if (description) {
      this.meta.updateTag({ name: 'description', content: description });
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({
        name: 'twitter:description',
        content: description,
      });
    }
    if (keywords) {
      this.meta.updateTag({ name: 'keywords', content: keywords });
    }
    if (image) {
      this.meta.updateTag({ property: 'og:image', content: image });
      this.meta.updateTag({ name: 'twitter:image', content: image });
      this.meta.updateTag({
        name: 'twitter:card',
        content: 'summary_large_image',
      });
    }
  }

  private getDeepestData(
    state: RouterStateSnapshot
  ): Record<string, any> | null {
    let route: any = state.root;
    let data: Record<string, any> | null = null;
    while (route.firstChild) {
      route = route.firstChild;
      if (route.data) data = route.data;
    }
    return data;
  }

  private resolveTitle(built: string | undefined | null): string {
    if (!built) {
      return this.suffix;
    }

    return built.includes(this.suffix) ? built : `${built} – ${this.suffix}`;
  }
}
