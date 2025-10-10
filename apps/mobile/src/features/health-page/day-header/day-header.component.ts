import { Component, inject, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { HealthStore } from '@cooksona/health';
import { ArrowLeft, ArrowRight } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

@Component({
  selector: 'ns-day-header',
  templateUrl: './day-header.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class DayHeaderComponent {
  private readonly store = inject(HealthStore);

  protected readonly dayLabel = this.store.dayLabel;
  protected readonly dateLabel = this.store.dateLabel;
  protected readonly isToday = this.store.isToday;

  icons = {
    ArrowLeft,
    ArrowRight,
  };

  protected goToPreviousDay(): void {
    this.store.goToPreviousDay();
  }

  protected goToNextDay(): void {
    this.store.goToNextDay();
  }

  formatDate(dateStr: string): string {
    // Some NativeScript runtimes may ignore explicit locale in toLocaleDateString
    // when Intl locale data isn't available. Format deterministically as dd.MM.yyyy.
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
