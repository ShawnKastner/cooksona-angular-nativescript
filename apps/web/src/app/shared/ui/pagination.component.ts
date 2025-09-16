import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex justify-center items-center gap-4 mt-6">
      <button
        type="button"
        class="px-3 py-1 rounded bg-base-200 text-gray-700 font-semibold disabled:opacity-50"
        (click)="prev()"
        [disabled]="page <= 1"
      >
        &lt; Vorherige
      </button>
      <span class="font-semibold">Seite {{ page }} von {{ totalPages }}</span>
      <button
        type="button"
        class="px-3 py-1 rounded bg-base-200 text-gray-700 font-semibold disabled:opacity-50"
        (click)="next()"
        [disabled]="page >= totalPages"
      >
        Nächste &gt;
      </button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Output() pageChange = new EventEmitter<number>();

  prev(): void {
    const p = Math.max(1, this.page - 1);
    if (p !== this.page) this.pageChange.emit(p);
  }
  next(): void {
    const p = Math.min(this.totalPages, this.page + 1);
    if (p !== this.page) this.pageChange.emit(p);
  }
}
