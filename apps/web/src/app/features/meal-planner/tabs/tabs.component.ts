// apps/web/src/app/features/planner/tabs.component.ts
import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';

export interface TabItem {
  id: string;
  label: string;
  icon?: string | null; // SVG string from libs/constants/icons
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective],
  templateUrl: './tabs.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent {
  @Input() tabs: TabItem[] = [];
  @Input() activeTab!: string;
  @Output() tabChange = new EventEmitter<string>();

  onSelect(id: string): void {
    this.tabChange.emit(id);
  }
}
