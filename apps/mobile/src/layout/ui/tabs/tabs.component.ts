import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { PlannerPageComponent } from '../../../features/planner-page/planner-page.component';
import {
  BookHeart,
  HeartPulse,
  User,
  UtensilsCrossed,
} from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

@Component({
  selector: 'ns-tabs',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe, PlannerPageComponent],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './tabs.component.html',
  styles: [``],
})
export class TabsComponent {
  selectedIndex = 0;

  icons = {
    UtensilsCrossed,
    BookHeart,
    HeartPulse,
    User,
  } as const;

  constructor() {}

  select(index: number) {
    this.selectedIndex = index;
  }
}
