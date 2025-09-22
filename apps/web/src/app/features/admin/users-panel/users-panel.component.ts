import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { UserApiService } from '@cooksona/api';
import { FormatDatePipe } from '../../../shared/pipes/format-date.pipe';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { User } from '@cooksona/models/user.models';
import { PaginationComponent } from '../../../shared/ui/pagination.component';
import { Pencil, Trash } from '@cooksona/constants/icons';
import { toErrorMessage } from '../../../shared/utils/error.utils';
import { EditUserModalComponent } from '../modals/edit-user-modal.component';
import { DeleteConfirmModalComponent } from '../../../shared/ui/modals/delete-confirm-modal/delete-confirm-modal.component';

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
  userPage = signal(1);
  USERS_PER_PAGE = signal(5);
  userTotalPages = computed(() =>
    Math.ceil(this.users().length / this.USERS_PER_PAGE()),
  );
  paginatedUsers = computed(() => {
    const start = (this.userPage() - 1) * this.USERS_PER_PAGE();
    return this.users().slice(start, start + this.USERS_PER_PAGE());
  });

  readonly icons = { Pencil, Trash } as const;

  async ngOnInit(): Promise<void> {
    await this.fetchUsers();
  }

  async fetchUsers(): Promise<void> {
    this.isLoadingUsers.set(true);
    this.error.set(null);
    try {
      const fetched = await this.usersApi.getAllUsers();
      this.users.set(fetched ?? []);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Benutzer konnten nicht geladen werden. Bitte versuche es später erneut.',
        ),
      );
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
    this.error.set(null);
    this.editingUser.set(u);
  }

  async handleUpdateUser(
    updated: Pick<User, 'id'> & Partial<User>,
  ): Promise<void> {
    this.error.set(null);
    try {
      const saved = await this.usersApi.updateUser(updated.id, updated);
      if (saved)
        this.users.set(
          this.users().map((u) => (u.id === saved.id ? saved : u)),
        );
      this.editingUser.set(null);
      this.success.set('Benutzer wurde aktualisiert.');
      setTimeout(() => this.success.set(null), 3500);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Der Benutzer konnte nicht aktualisiert werden. Bitte versuche es später erneut.',
        ),
      );
    }
  }

  prepareDeleteUser(u: User): void {
    this.error.set(null);
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
    this.error.set(null);
    try {
      await this.usersApi.deleteUser(id);
      this.users.set(this.users().filter((u) => u.id !== id));
      this.success.set('Benutzer erfolgreich gelöscht.');
      setTimeout(() => this.success.set(null), 3500);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Der Benutzer konnte nicht gelöscht werden. Bitte versuche es später erneut.',
        ),
      );
    } finally {
      this.closeDeleteUserModal();
    }
  }
}
