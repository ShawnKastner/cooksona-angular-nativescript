// apps/web/src/app/features/admin/admin-dashboard.component.ts
import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import {
  Shield,
  Users,
  Pencil,
  Trash,
  Inbox,
  Clipboard,
} from 'libs/constants/icons';
import { DeleteConfirmModalComponent } from '../../shared/ui/modals/delete-confirm-modal.component';
import { User } from '@cooksona/models/user.models';
import { UserApiService, InvitesApiService } from '@cooksona/api';
import { Invite } from '@cooksona/models/invite.models';
import { EditUserModalComponent } from './edit-user-modal.component';
import { CreateInviteModalComponent } from './create-invite-modal.component';
import { ContactRequestsPanelComponent } from './contact-requests-panel.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SvgInjectDirective,
    DeleteConfirmModalComponent,
    EditUserModalComponent,
    CreateInviteModalComponent,
    ContactRequestsPanelComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly usersApi = inject(UserApiService);
  private readonly invitesApi = inject(InvitesApiService);

  // Tabs
  activeTab = signal<'users' | 'invites' | 'contact'>('users');

  // Users
  users = signal<User[]>([]);
  isLoadingUsers = signal(true);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  editingUser = signal<User | null>(null);
  deleteUserModalOpen = signal(false);
  deleteUserId = signal<string | null>(null);
  deleteUserError = signal<string | null>(null);
  userPage = signal(1);
  readonly USERS_PER_PAGE = 5;
  userTotalPages = computed(() =>
    Math.ceil(this.users().length / this.USERS_PER_PAGE)
  );
  paginatedUsers = computed(() => {
    const start = (this.userPage() - 1) * this.USERS_PER_PAGE;
    return this.users().slice(start, start + this.USERS_PER_PAGE);
  });

  // Invites
  invites = signal<Invite[]>([]);
  isLoadingInvites = signal(true);
  invitePage = signal(1);
  readonly INVITES_PER_PAGE = 5;
  copiedInviteId = signal<string | null>(null);
  deleteInviteModalOpen = signal(false);
  deleteInviteId = signal<string | null>(null);
  inviteTotalPages = computed(() =>
    Math.ceil(this.invites().length / this.INVITES_PER_PAGE)
  );
  paginatedInvites = computed(() => {
    const start = (this.invitePage() - 1) * this.INVITES_PER_PAGE;
    return this.invites().slice(start, start + this.INVITES_PER_PAGE);
  });
  inviteOpen = signal(false);

  readonly icons = { Shield, Users, Pencil, Trash, Inbox, Clipboard } as const;

  async ngOnInit(): Promise<void> {
    await Promise.all([this.fetchUsers(), this.fetchInvites()]);
  }

  async fetchUsers(): Promise<void> {
    this.isLoadingUsers.set(true);
    try {
      const fetched = await this.usersApi.getAllUsers();
      this.users.set(fetched ?? []);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Benutzer konnten nicht geladen werden.');
    } finally {
      this.isLoadingUsers.set(false);
    }
  }

  async fetchInvites(): Promise<void> {
    this.isLoadingInvites.set(true);
    try {
      const fetched = await this.invitesApi.getAllInvites();
      const sorted = (fetched ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      this.invites.set(sorted);
    } catch (err: any) {
      this.error.set(
        err?.message ?? 'Einladungen konnten nicht geladen werden.'
      );
    } finally {
      this.isLoadingInvites.set(false);
    }
  }

  setTab(tab: 'users' | 'invites' | 'contact'): void {
    this.activeTab.set(tab);
    if (tab === 'users') this.userPage.set(1);
    if (tab === 'invites') this.invitePage.set(1);
  }

  maskEmail(email: string): string {
    const [name, domain] = (email || '').split('@');
    if (!name || !domain) return email;
    const masked =
      name.length <= 2
        ? name[0] + '*'
        : name[0] +
          '*'.repeat(Math.max(1, name.length - 2)) +
          name[name.length - 1];
    return `${masked}@${domain}`;
  }

  formatDate(iso?: string | null): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString('de-DE');
    } catch {
      return String(iso);
    }
  }

  // Users actions
  startEditUser(u: User): void {
    this.editingUser.set(u);
  }
  async handleUpdateUser(updated: {
    id: string;
    role?: string;
    subscriptionEndsAt?: string;
    lifetimeSubscription?: boolean;
  }): Promise<void> {
    try {
      const saved = await this.usersApi.updateUser(updated.id, updated as any);
      if (saved)
        this.users.set(
          this.users().map((u) => (u.id === saved.id ? saved : u))
        );
      this.editingUser.set(null);
    } catch (err: any) {
      this.error.set(
        err?.message ?? 'Fehler beim Aktualisieren des Benutzers.'
      );
    }
  }
  prepareDeleteUser(u: User): void {
    this.deleteUserId.set(u.id);
    this.deleteUserModalOpen.set(true);
  }
  closeDeleteUserModal(): void {
    this.deleteUserModalOpen.set(false);
    setTimeout(() => this.deleteUserId.set(null), 150);
  }
  pendingUserDetails(): string {
    const id = this.deleteUserId();
    const u = this.users().find((x) => x.id === id);
    return u ? `Benutzer '${u.name}' wird gelöscht.` : '';
  }
  async confirmDeleteUser(): Promise<void> {
    const id = this.deleteUserId();
    if (!id) return;
    try {
      await this.usersApi.deleteUser(id);
      this.users.set(this.users().filter((u) => u.id !== id));
      this.success.set('Benutzer erfolgreich gelöscht.');
      setTimeout(() => this.success.set(null), 3500);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Fehler beim Löschen des Benutzers.');
    } finally {
      this.closeDeleteUserModal();
    }
  }

  // Invites actions
  copyInvite(inv: Invite): void {
    try {
      const url = `${window.location.origin}/invite/redeem/${inv.token}`;
      navigator.clipboard.writeText(url);
      this.copiedInviteId.set(inv.id);
      setTimeout(() => this.copiedInviteId.set(null), 2000);
    } catch {}
  }
  openDeleteInvite(inv: Invite): void {
    this.deleteInviteId.set(inv.id);
    this.deleteInviteModalOpen.set(true);
  }
  pendingInviteDetails(): string {
    const id = this.deleteInviteId();
    const inv = this.invites().find((x) => x.id === id);
    return inv ? `Token ${this.shortToken(inv.token)} wird gelöscht.` : '';
  }
  closeDeleteInviteModal(): void {
    this.deleteInviteModalOpen.set(false);
    setTimeout(() => this.deleteInviteId.set(null), 150);
  }
  async confirmDeleteInvite(): Promise<void> {
    const id = this.deleteInviteId();
    if (!id) return;
    try {
      await this.invitesApi.deleteInvite(id);
      this.invites.set(this.invites().filter((i) => i.id !== id));
      this.success.set('Einladungslink erfolgreich gelöscht.');
      setTimeout(() => this.success.set(null), 3500);
    } catch (err: any) {
      this.error.set(err?.message ?? 'Fehler beim Löschen der Einladung.');
    } finally {
      this.closeDeleteInviteModal();
    }
  }
  handleInviteCreated(inv: Invite): void {
    this.invites.set([inv, ...this.invites()]);
  }
  shortToken(token: string): string {
    return token ? `${token.slice(0, 3)}...${token.slice(-3)}` : '';
  }
}
