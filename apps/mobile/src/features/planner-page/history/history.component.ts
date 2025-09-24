import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { BookOpen } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

@Component({
  selector: 'ns-history',
  templateUrl: './history.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HistoryComponent {
  icons = {
    BookOpen,
  } as const;
}
