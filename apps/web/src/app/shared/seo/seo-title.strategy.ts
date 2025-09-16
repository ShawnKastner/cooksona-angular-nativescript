import { Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SeoTitleStrategy extends TitleStrategy {
  private readonly suffix = 'CookSona';

  constructor(private readonly title: Title) {
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
  }
}

