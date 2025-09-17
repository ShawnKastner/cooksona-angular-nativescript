import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { UserApiService } from '@cooksona/api';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { User } from '@cooksona/models/user.models';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { Pencil, Trash } from '@cooksona/constants/icons';
import { EditUserModalComponent } from './edit-user-modal.component';
import { DeleteConfirmModalComponent } from '../../shared/ui/modals/delete-confirm-modal.component';

@Component({
  selector: 'app-users-panel',
  standalone: true,
  imports: [
    FormatDatePipe,
    SvgInjectDirective,
    PaginationComponent,
    EditUserModalComponent,
    DeleteConfirmModalComponent,
  ],
  templateUrl: './users-panel.component.html',
})
export class UsersPanelComponent implements OnInit {
  private readonly usersApi = inject(UserApiService);
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

  readonly icons = { Pencil, Trash } as const;

  async ngOnInit(): Promise<void> {
    await this.fetchUsers();
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
}
