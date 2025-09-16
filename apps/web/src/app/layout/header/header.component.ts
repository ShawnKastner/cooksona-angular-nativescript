import { Component, ElementRef, HostListener, ChangeDetectionStrategy } from '@angular/core';
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
} from 'libs/constants/icons';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, SvgInjectDirective],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  isDropdownOpen = false;

  readonly icons = {
    UtensilsCrossed,
    User,
    LogOut,
    BookHeart,
    Shield,
    MessageSquare,
  } as const;

  constructor(
    private readonly router: Router,
    private readonly auth: AuthService,
    private readonly el: ElementRef
  ) {}

  get user$() {
    return this.auth.currentUser$;
  }

  @HostListener('document:mousedown', ['$event'])
  onDocClick(event: MouseEvent): void {
    const clickedInside = this.el.nativeElement.contains(event.target as Node);
    if (!clickedInside && this.isDropdownOpen) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  navigateTo(path: string): void {
    this.closeDropdown();
    this.router.navigateByUrl(path).catch(() => {});
  }

  logout(): void {
    this.auth.logout();
    this.closeDropdown();
    this.router.navigateByUrl('/login').catch(() => {});
  }
}
