import {
  Component,
  ElementRef,
  HostListener,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '@cooksona/auth';
import {
  UtensilsCrossed,
  User,
  LogOut,
  BookHeart,
  Shield,
  MessageSquare,
  Heart,
  HeartPulse,
} from '@cooksona/constants/icons';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { SnackbarService } from '../../shared/ui/snackbar/snackbar.service';
import { toErrorMessage } from '../../shared/utils/error.utils';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SvgInjectDirective],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  isDropdownOpen = signal(false);

  readonly icons = {
    UtensilsCrossed,
    User,
    LogOut,
    BookHeart,
    Shield,
    MessageSquare,
    HeartPulse,
  } as const;

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly el: ElementRef,
    private readonly snackbar: SnackbarService,
  ) {}

  get user$() {
    return this.auth.currentUser$;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocClick(event: MouseEvent): void {
    const clickedInside = this.el.nativeElement.contains(event.target as Node);
    if (!clickedInside && this.isDropdownOpen()) {
      this.isDropdownOpen.set(false);
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen.set(!this.isDropdownOpen());
  }

  closeDropdown(): void {
    this.isDropdownOpen.set(false);
  }

  navigateTo(path: string): void {
    this.closeDropdown();
    this.router
      .navigateByUrl(path)
      .catch((navigationError) =>
        console.error('Header navigation failed', navigationError),
      );
  }

  async logout(): Promise<void> {
    try {
      await this.auth.logout();
      this.closeDropdown();
      await this.router
        .navigateByUrl('/login')
        .catch((navigationError) =>
          console.error(
            'Redirect to login after logout failed',
            navigationError,
          ),
        );
    } catch (error) {
      this.snackbar.error(
        toErrorMessage(
          error,
          'Abmeldung fehlgeschlagen. Bitte versuche es später erneut.',
        ),
      );
    }
  }
}
