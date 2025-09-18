import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { Shield, Users, Inbox } from '@cooksona/constants/icons';
import { ContactRequestsPanelComponent } from './contact-requests-panel.component';
import { InvitesPanelComponent } from './invites-panel.component';
import { UsersPanelComponent } from './users-panel.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SvgInjectDirective,
    ContactRequestsPanelComponent,
    InvitesPanelComponent,
    UsersPanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent {
  activeTab = signal<'users' | 'invites' | 'contact'>('users');
  userPage = signal(1);
  invitePage = signal(1);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  readonly icons = { Shield, Users, Inbox } as const;

  setTab(tab: 'users' | 'invites' | 'contact'): void {
    this.activeTab.set(tab);
    if (tab === 'users') this.userPage.set(1);
    if (tab === 'invites') this.invitePage.set(1);
  }
}
