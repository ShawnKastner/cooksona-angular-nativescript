import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectionStrategy,
  HostListener,
} from '@angular/core';
import { Recipe } from '@cooksona/models/recipe.models';
import { SvgInjectDirective } from '../../../directives/svg-inject.directive';
import {
  BookText,
  Heart,
  Wand2,
  Users,
  Printer,
  X,
} from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';
import { FocusTrapDirective } from '../../focus-trap.directive';

@Component({
  selector: 'app-recipe-detail-modal',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective, FocusTrapDirective],
  templateUrl: './recipe-detail-modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeDetailModalComponent {
  @Input() open = false;
  @Input() recipe: Recipe | null = null;
  @Input() isFavorite = false;
  @Output() close = new EventEmitter<void>();
  @Output() toggleFavorite = new EventEmitter<Recipe>();
  @Output() openTransform = new EventEmitter<Recipe>();

  readonly icons = { BookText, Heart, Wand2, Users, Printer, X } as const;

  constructor(private readonly auth: AuthService) {}

  get isPro(): boolean {
    try {
      return this.auth.isProUser();
    } catch {
      return true;
    }
  }

  handleTransformClick(): void {
    const r = this.recipe;
    this.close.emit();
    if (r) setTimeout(() => this.openTransform.emit(r), 150);
  }

  handlePrint(): void {
    const after = () => {
      document.body.classList.remove('print-active');
      window.removeEventListener('afterprint', after);
    };
    let listenerRegistered = false;
    try {
      document.body.classList.add('print-active');
      window.addEventListener('afterprint', after);
      listenerRegistered = true;
      window.print();
    } catch {
      if (listenerRegistered) {
        window.removeEventListener('afterprint', after);
        document.body.classList.remove('print-active');
      }
      window.alert(
        'Der Druck konnte nicht gestartet werden. Bitte nutze die Druckfunktion deines Browsers (z.B. Strg+P).'
      );
    }
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.open) this.close.emit();
  }
}
