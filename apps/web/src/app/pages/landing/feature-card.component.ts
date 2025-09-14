import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';

export interface FeatureCardProps {
  icon: string; // SVG string
  title: string;
  desc: string;
}

@Component({
  selector: 'app-feature-card',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective],
  template: `
    <div
      class="bg-base-200 rounded-xl p-6 shadow-soft flex flex-col items-center"
    >
      <div class="h-8 w-8 text-primary" [svgInject]="icon"></div>
      <h2 class="text-xl font-bold mt-4 mb-2 text-neutral">{{ title }}</h2>
      <p class="text-gray-600 text-base">{{ desc }}</p>
    </div>
  `,
})
export class FeatureCardComponent implements FeatureCardProps {
  @Input() icon!: string;
  @Input() title!: string;
  @Input() desc!: string;
}
