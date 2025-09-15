// apps/web/src/app/features/admin/admin-dashboard.component.ts
import { Component, OnInit, inject, signal, computed } from '@angular/core';
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
import { DeleteConfirmModalComponent } from '../../components/modals/delete-confirm-modal.component';
import { User } from '@cooksona/models/user.models';
import {
  UserApiService,
  InvitesApiService,
  ContactApiService,
} from '@cooksona/api';
import { Invite } from '@cooksona/models/invite.models';
import { SeoComponent } from '../../shared/seo/seo.component';
import { EditUserModalComponent } from './edit-user-modal.component';
import { CreateInviteModalComponent } from './create-invite-modal.component';
import { ContactRequestsPanelComponent } from './contact-requests-panel.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SvgInjectDirective,
    DeleteConfirmModalComponent,
    SeoComponent,
    EditUserModalComponent,
    CreateInviteModalComponent,
    ContactRequestsPanelComponent,
  ],
  template: `
    <app-seo
      [title]="'Admin – CookSona'"
      [description]="
        'Admin-Dashboard für Benutzer, Einladungen und Kontaktanfragen.'
      "
    />
    <div class="max-w-6xl mx-auto p-8">
      @if (success()) {
      <div
        class="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-green-100 text-green-800 px-6 py-3 rounded-xl shadow font-semibold"
      >
        {{ success() }}
      </div>
      }
      <div class="flex items-center gap-4 mb-2">
        <span class="w-10 h-10 text-primary" [svgInject]="icons.Shield"></span>
        <div>
          <h1 class="text-4xl font-serif font-bold">Admin Dashboard</h1>
          <div class="text-gray-500 text-lg">
            Verwaltung und Systemübersicht.
          </div>
        </div>
      </div>
      <div
        class="bg-white p-6 md:p-8 rounded-2xl shadow-soft border border-base-200 mb-10"
        style="overflow-x: auto"
      >
        <div class="flex gap-8 border-b mb-8 mt-6">
          <button
            class="flex items-center gap-2 pb-3 px-2 text-lg font-semibold border-b-2 transition-colors"
            [ngClass]="
              activeTab() === 'users'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-primary'
            "
            (click)="setTab('users')"
          >
            <span class="w-5 h-5" [svgInject]="icons.Users"></span> Benutzer
            verwalten
          </button>
          <button
            class="flex items-center gap-2 pb-3 px-2 text-lg font-semibold border-b-2 transition-colors"
            [ngClass]="
              activeTab() === 'invites'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-primary'
            "
            (click)="setTab('invites')"
          >
            <span class="w-5 h-5" [svgInject]="icons.Shield"></span>
            Einladungslinks
          </button>
          <button
            class="flex items-center gap-2 pb-3 px-2 text-lg font-semibold border-b-2 transition-colors"
            [ngClass]="
              activeTab() === 'contact'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-primary'
            "
            (click)="setTab('contact')"
          >
            <span class="w-5 h-5" [svgInject]="icons.Inbox"></span>
            Kontaktanfragen
          </button>
        </div>

        @if (activeTab() === 'users') {
        <div>
          @if (isLoadingUsers()) {
          <p>Lade Benutzer...</p>
          } @if (error()) {
          <div class="text-error bg-red-50 p-4 rounded-lg">{{ error() }}</div>
          } @if (!isLoadingUsers() && !error()) {
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white text-sm">
              <thead class="bg-base-200/60">
                <tr>
                  <th class="text-left font-semibold text-neutral p-3">Name</th>
                  <th class="text-left font-semibold text-neutral p-3">
                    E-Mail
                  </th>
                  <th class="text-left font-semibold text-neutral p-3">
                    Rolle
                  </th>
                  <th class="text-left font-semibold text-neutral p-3">Abo</th>
                  <th class="text-left font-semibold text-neutral p-3">
                    Registriert am
                  </th>
                  <th class="text-right font-semibold text-neutral p-3">
                    Aktionen
                  </th>
                </tr>
              </thead>
              <tbody>
                @for (user of paginatedUsers(); track user.id; let i = $index) {
                <tr
                  class="border-b border-base-200"
                  [ngClass]="i % 2 === 0 ? 'bg-white' : 'bg-base-100/30'"
                >
                  <td class="p-3 font-medium text-neutral">{{ user.name }}</td>
                  <td class="p-3 text-gray-600">{{ maskEmail(user.email) }}</td>
                  <td class="p-3 text-gray-600 capitalize">{{ user.role }}</td>
                  <td class="p-3">
                    {{
                      user.lifetimeSubscription
                        ? 'Lifetime'
                        : user.subscriptionEndsAt
                        ? 'Bis ' + formatDate(user.subscriptionEndsAt)
                        : 'Kein Abo'
                    }}
                  </td>
                  <td class="p-3 text-gray-600">
                    {{ formatDate($any(user).createdAt) }}
                  </td>
                  <td class="p-3 text-right">
                    <div class="flex justify-end items-center gap-2">
                      <button
                        (click)="startEditUser(user)"
                        class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                        title="Benutzer bearbeiten"
                      >
                        <span class="w-4 h-4" [svgInject]="icons.Pencil"></span>
                      </button>
                      <button
                        (click)="prepareDeleteUser(user)"
                        class="p-2 text-gray-500 hover:text-error hover:bg-error/10 rounded-full transition-colors"
                        title="Benutzer löschen"
                      >
                        <span class="w-4 h-4" [svgInject]="icons.Trash"></span>
                      </button>
                    </div>
                  </td>
                </tr>
                }
              </tbody>
            </table>
          </div>
          @if (userTotalPages() > 1) {
          <div class="flex justify-center items-center gap-4 mt-6">
            <button
              class="px-3 py-1 rounded bg-base-200 text-gray-700 disabled:opacity-50"
              [disabled]="userPage() === 1"
              (click)="userPage.set(userPage() > 1 ? userPage() - 1 : 1)"
            >
              &lt; Vorherige
            </button>
            <span class="font-semibold"
              >Seite {{ userPage() }} von {{ userTotalPages() }}</span
            >
            <button
              class="px-3 py-1 rounded bg-base-200 text-gray-700 disabled:opacity-50"
              [disabled]="userPage() === userTotalPages()"
              (click)="
                userPage.set(
                  userPage() < userTotalPages()
                    ? userPage() + 1
                    : userTotalPages()
                )
              "
            >
              Nächste &gt;
            </button>
          </div>
          } @if (users().length === 0) {
          <p class="text-center text-gray-500 py-8">Keine Benutzer gefunden.</p>
          } }
        </div>
        } @if (activeTab() === 'invites') {
        <div>
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-serif font-bold text-neutral">
              Einladungslinks
            </h2>
            <button
              (click)="inviteOpen.set(true)"
              class="flex items-center gap-2 bg-yellow-200 text-yellow-900 font-bold px-4 py-2 rounded-lg hover:bg-yellow-300 transition-colors"
            >
              <span class="w-5 h-5" [svgInject]="icons.Shield"></span>
              Neuen Link erstellen
            </button>
          </div>
          @if (isLoadingInvites()) {
          <div>Lade Einladungen ...</div>
          } @else if (invites().length === 0) {
          <div class="text-gray-500">Keine Einladungen vorhanden.</div>
          } @else {
          <table class="w-full border rounded-xl overflow-hidden mb-8 text-sm">
            <thead class="bg-base-200">
              <tr>
                <th class="p-3 text-left">Link-Token</th>
                <th class="p-3 text-left">Beschreibung</th>
                <th class="p-3 text-left">Rolle</th>
                <th class="p-3 text-left">Abo</th>
                <th class="p-3 text-left">Erstellt am</th>
                <th class="p-3 text-left">Gültig bis</th>
                <th class="p-3 text-left">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              @for (inv of paginatedInvites(); track inv.id) {
              <tr class="border-b">
                <td class="p-3 font-mono">{{ shortToken(inv.token) }}</td>
                <td class="p-3 text-gray-600">{{ inv.description || '-' }}</td>
                <td class="p-3">{{ inv.presetRole }}</td>
                <td class="p-3">
                  {{
                    inv.lifetimeSubscription
                      ? 'Lifetime'
                      : inv.subscriptionEndsAt
                      ? 'Custom'
                      : 'Kein Abo'
                  }}
                </td>
                <td class="p-3">
                  {{ inv.createdAt ? formatDate(inv.createdAt) : '-' }}
                </td>
                <td class="p-3">
                  {{ inv.expiresAt ? formatDate(inv.expiresAt) : 'Unbegrenzt' }}
                </td>
                <td class="p-3">
                  <button
                    class="p-2 text-gray-500 hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    (click)="copyInvite(inv)"
                    title="Einladungslink kopieren"
                  >
                    <span class="w-4 h-4" [svgInject]="icons.Clipboard"></span>
                  </button>
                  @if (copiedInviteId() === inv.id) {
                  <span class="ml-2 text-green-600 text-xs">Kopiert!</span> }
                  <button
                    class="p-2 text-gray-500 hover:text-error hover:bg-error/10 rounded-full transition-colors"
                    (click)="openDeleteInvite(inv)"
                    title="Einladung löschen"
                  >
                    <span class="w-4 h-4" [svgInject]="icons.Trash"></span>
                  </button>
                </td>
              </tr>
              }
            </tbody>
          </table>
          @if (inviteTotalPages() > 1) {
          <div class="flex justify-center items-center gap-4 mt-6">
            <button
              class="px-3 py-1 rounded bg-base-200 text-gray-700 disabled:opacity-50"
              [disabled]="invitePage() === 1"
              (click)="invitePage.set(invitePage() > 1 ? invitePage() - 1 : 1)"
            >
              &lt; Vorherige
            </button>
            <span class="font-semibold"
              >Seite {{ invitePage() }} von {{ inviteTotalPages() }}</span
            >
            <button
              class="px-3 py-1 rounded bg-base-200 text-gray-700 disabled:opacity-50"
              [disabled]="invitePage() === inviteTotalPages()"
              (click)="
                invitePage.set(
                  invitePage() < inviteTotalPages()
                    ? invitePage() + 1
                    : inviteTotalPages()
                )
              "
            >
              Nächste &gt;
            </button>
          </div>
          } }
        </div>
        } @if (activeTab() === 'contact') {
        <app-contact-requests-panel />
        }
      </div>

      <!-- Modals -->
      <app-edit-user-modal
        [open]="!!editingUser()"
        [user]="editingUser()"
        (close)="editingUser.set(null)"
        (save)="handleUpdateUser($event)"
      />

      <app-create-invite-modal
        [open]="inviteOpen()"
        (close)="inviteOpen.set(false)"
        (created)="handleInviteCreated($event)"
      />

      <app-delete-confirm-modal
        [open]="deleteInviteModalOpen()"
        [title]="'Einladung löschen'"
        [message]="'Möchtest du diese Einladung wirklich löschen?'"
        [details]="pendingInviteDetails()"
        [confirmText]="'Löschen'"
        (cancel)="closeDeleteInviteModal()"
        (confirm)="confirmDeleteInvite()"
      />

      <app-delete-confirm-modal
        [open]="deleteUserModalOpen()"
        [title]="'Benutzer löschen'"
        [message]="'Möchtest du diesen Benutzer wirklich löschen?'"
        [details]="pendingUserDetails()"
        [confirmText]="'Löschen'"
        (cancel)="closeDeleteUserModal()"
        (confirm)="confirmDeleteUser()"
      />
    </div>
  `,
})
export class AdminDashboard implements OnInit {
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
