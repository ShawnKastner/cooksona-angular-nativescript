import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { SvgInjectDirective } from '../../../directives/svg-inject.directive';
import { FocusTrapDirective } from '../../focus-trap.directive';
import { X, Trash } from '@cooksona/constants/icons';
import { LoadingSpinnerSmallComponent } from '../../loading-spinner/loading-spinner-small.component';

@Component({
  selector: 'app-delete-confirm-modal',
  standalone: true,
  imports: [
    CommonModule,
    SvgInjectDirective,
    FocusTrapDirective,
    LoadingSpinnerSmallComponent,
  ],
  templateUrl: './delete-confirm-modal.component.html',
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
    if (!this.busy) {
      this.cancel.emit();
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open && !this.busy) {
      this.cancel.emit();
    }
  }
}
