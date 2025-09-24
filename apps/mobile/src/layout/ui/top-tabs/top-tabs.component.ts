import {
  Component,
  EventEmitter,
  Input,
  Output,
  NO_ERRORS_SCHEMA,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

export type TopTabKey = string;

export interface TopTab {
  key: TopTabKey;
  label: string;
  iconSvg: string;
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
  @Input() tabs: TopTab[] = [];
  @Input() selected: TopTabKey = '';
  @Output() selectedChange = new EventEmitter<TopTabKey>();

  // Farben für Icons
  @Input() activeColor = '#0EA5E9'; // z. B. sky-500
  @Input() inactiveColor = '#94A3B8'; // slate-400

  onSelect(tab: TopTab) {
    if (tab.disabled) return;
    if (this.selected !== tab.key) {
      this.selected = tab.key;
      this.selectedChange.emit(tab.key);
    }
  }
}
