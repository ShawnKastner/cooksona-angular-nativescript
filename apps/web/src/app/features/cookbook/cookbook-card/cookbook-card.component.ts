import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Recipe } from '@cooksona/models/recipe.models';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import {
  BookText,
  Trash,
  Wand2,
  Users,
  FolderPlus,
} from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';

@Component({
  selector: 'app-cookbook-card',
  standalone: true,
  imports: [CommonModule, SvgInjectDirective],
  templateUrl: './cookbook-card.component.html',
})
export class CookbookCardComponent {
  @Input({ required: true }) recipe!: Recipe;
  @Output() onShowDetails = new EventEmitter<void>();
  @Output() onRemove = new EventEmitter<void>();
  @Output() onOpenTransformModal = new EventEmitter<void>();
  @Output() onAddToCollection = new EventEmitter<void>();

  private readonly auth = inject(AuthService);
  readonly icons = { BookText, Trash, Wand2, Users, FolderPlus } as const;

  get isPro(): boolean {
    try {
      return this.auth.isProUser();
    } catch {
      return true;
    }
  }
}
