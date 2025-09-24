import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ClipboardList } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { NativeScriptCommonModule } from '@nativescript/angular';

@Component({
  selector: 'ns-shopping-list',
  templateUrl: './shopping-list.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class ShoppingListComponent {
  icons = {
    ClipboardList,
  } as const;
}
