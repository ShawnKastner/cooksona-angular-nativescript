// apps/web/src/app/features/planner/tabs.component.ts
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';

export interface TabItem {
    id: string;
    label: string;
    icon?: string | null; // SVG string from libs/constants/icons
}

@Component({
    selector: 'app-tabs',
    standalone: true,
    imports: [CommonModule, SvgInjectDirective],
    template: `
    <div class="border-b border-base-300 w-full max-w-full">
      <nav
        class="w-full max-w-full -mb-px flex space-x-4 sm:space-x-6 overflow-x-auto scrollbar-hide px-2"
        aria-label="Tabs"
        [ngStyle]="{ webkitOverflowScrolling: 'touch', 'touch-action': 'pan-x' }"
      >
      @for(tab of tabs; track tab){
        <button
          type="button"
          (click)="onSelect(tab.id)"
          class="flex items-center gap-2 whitespace-nowrap py-3 px-2 sm:px-3 border-b-2 font-medium text-sm transition-colors flex-shrink-0"
          [ngClass]="activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
          [attr.aria-current]="activeTab === tab.id ? 'page' : null"
        >
        
        @if(tab.icon){
          <span class="w-5 h-5" [svgInject]="tab.icon!"></span>
        }
          {{ tab.label }}
        </button>
    }
      </nav>
    </div>
  `,
})
export class TabsComponent {
    @Input() tabs: TabItem[] = [];
    @Input() activeTab!: string;
    @Output() tabChange = new EventEmitter<string>();

    onSelect(id: string): void {
        this.tabChange.emit(id);
    }
}

