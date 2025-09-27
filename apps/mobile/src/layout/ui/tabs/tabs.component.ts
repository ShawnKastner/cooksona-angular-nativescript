import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterModule,
} from '@angular/router';
import {
  BookHeart,
  HeartPulse,
  User,
  UtensilsCrossed,
} from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { PlannerStore } from '../../../features/planner-page/planner.store';

@Component({
  selector: 'ns-tabs',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe, RouterModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './tabs.component.html',
  providers: [PlannerStore],
})
export class TabsComponent {
  selectedIndex = signal(0);

  icons = {
    UtensilsCrossed,
    BookHeart,
    HeartPulse,
    User,
  } as const;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
  ) {
    // sync selected tab with current URL
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        const url = e.urlAfterRedirects || e.url;
        if (url.includes('/cookbook')) this.selectedIndex.set(1);
        else if (url.includes('/health')) this.selectedIndex.set(2);
        else if (url.includes('/profile')) this.selectedIndex.set(3);
        else this.selectedIndex.set(0); // includes plan and recipe
      }
    });
  }

  select(index: number) {
    this.selectedIndex.set(index);
    const target =
      index === 0
        ? 'plan'
        : index === 1
          ? 'cookbook'
          : index === 2
            ? 'health'
            : 'profile';
    void this.router.navigate([target], { relativeTo: this.route });
  }
}
