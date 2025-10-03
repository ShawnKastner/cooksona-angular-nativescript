import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Apple, Dumbbell } from '@cooksona/constants/icons';

@Component({
  selector: 'ns-tracking-actions',
  templateUrl: './tracking-actions.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class TrackingActionsComponent {
  icons = {
    Dumbbell,
    Apple,
  };

  constructor(private routerExtensions: RouterExtensions) {}

  protected logQuickActivity(): void {
    this.routerExtensions.navigate(['/track-activity']);
  }

  protected logQuickMeal(): void {
    console.warn('TODO: Implement meal logging flow');
  }
}
