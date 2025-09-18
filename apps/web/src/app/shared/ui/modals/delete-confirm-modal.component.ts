import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { SvgInjectDirective } from '../../directives/svg-inject.directive';
import { FocusTrapDirective } from '../focus-trap.directive';
import { X, Trash } from '@cooksona/constants/icons';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective, FocusTrapDirective],
  template: `
    @if (open) {
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4"
      (click)="onOverlayClick()"
      role="dialog"
      aria-modal="true"
      [attr.aria-labelledby]="'modal-title'"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl max-w-md w-full relative border border-base-200"
        (click)="$event.stopPropagation()"
        appFocusTrap
      >
        <div class="flex items-center justify-between p-5 pb-3">
          <h2 class="text-xl font-bold text-neutral" id="modal-title">
            {{ title || 'Wirklich löschen?' }}
          </h2>
          <button
            type="button"
            class="p-2 rounded-full text-gray-400 hover:bg-base-200 hover:text-neutral transition-colors"
            (click)="cancel.emit()"
            [disabled]="busy"
            aria-label="Schließen"
          >
            <span class="w-6 h-6" [svgInject]="icons.X"></span>
          </button>
        </div>
        <div class="px-5 pb-5">
          <div class="flex items-start gap-3">
            <div class="mt-1">
              <span class="w-7 h-7 text-error" [svgInject]="icons.Trash"></span>
            </div>
            <div class="text-sm text-gray-700">
              <p class="mb-2">
                {{
                  message ||
                    'Diese Aktion kann nicht rückgängig gemacht werden.'
                }}
              </p>
              @if (details) {
              <p class="text-error font-semibold">{{ details }}</p>
              }
            </div>
          </div>
          <div class="flex flex-row-reverse gap-3 mt-6">
            <button
              type="button"
              class="px-6 py-2 rounded-lg font-bold bg-error text-white hover:bg-error/80 transition-colors shadow-soft disabled:opacity-60"
              (click)="confirm.emit()"
              [disabled]="busy"
            >
              {{ confirmText || 'Löschen' }}
            </button>
            <button
              type="button"
              class="px-6 py-2 rounded-lg font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-soft disabled:opacity-60"
              (click)="cancel.emit()"
              [disabled]="busy"
            >
              {{ cancelText || 'Abbrechen' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteConfirmModalComponent {
  @Input() open = false;
  @Input() title?: string;
  @Input() message?: string;
  @Input() details?: string;
  @Input() confirmText?: string;
  @Input() cancelText?: string;
  @Input() busy = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  readonly icons = { X, Trash } as const;

  onOverlayClick(): void {
    if (!this.busy) this.cancel.emit();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open && !this.busy) this.cancel.emit();
  }
}
