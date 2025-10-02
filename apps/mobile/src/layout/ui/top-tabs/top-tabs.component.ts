import {
  Component,
  NO_ERRORS_SCHEMA,
  input,
  output,
  model,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Page } from '@nativescript/core';

export type TopTabKey = string;

export interface TopTab {
  key: TopTabKey;
  label: string;
  iconSvg?: string;
  disabled?: boolean;
}

@Component({
  selector: 'ns-top-tabs',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './top-tabs.component.html',
})
export class TopTabsComponent {
  tabs = input<TopTab[]>([]);
  selected = model<TopTabKey>('');
  progress = input<number>(0);
  selectedChange = output<TopTabKey>();
  compact = input<boolean>(false);

  // Farben für Icons
  activeColor = input<string>('#0EA5E9'); // z. B. sky-500
  inactiveColor = input<string>('#94A3B8'); // slate-400

  constructor(private page: Page) {
    this.page.actionBarHidden = true;
  }

  onSelect(tab: TopTab) {
    if (tab.disabled) return;
    if (this.selected() !== tab.key) {
      this.selected.set(tab.key);
      this.selectedChange.emit(tab.key);
    }
  }
}
