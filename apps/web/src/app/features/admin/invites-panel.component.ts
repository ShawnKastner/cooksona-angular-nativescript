import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { FormatDatePipe } from '../../shared/pipes/format-date.pipe';
import { Shield, Clipboard, Trash } from '@cooksona/constants/icons';
import { Invite } from '@cooksona/models/invite.models';
import { InvitesApiService } from '@cooksona/api';
import { CreateInviteModalComponent } from './create-invite-modal.component';
import { DeleteConfirmModalComponent } from '../../shared/ui/modals/delete-confirm-modal.component';
import { toErrorMessage } from '../../shared/utils/error.utils';

@Component({
  selector: 'app-invites-panel',
  standalone: true,
  imports: [
    PaginationComponent,
    SvgInjectDirective,
    FormatDatePipe,
    CreateInviteModalComponent,
    DeleteConfirmModalComponent,
  ],
  templateUrl: './invites-panel.component.html',
})
export class InvitesPanelComponent implements OnInit {
  private readonly invitesApi = inject(InvitesApiService);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
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

  readonly icons = { Shield, Clipboard, Trash } as const;

  async ngOnInit(): Promise<void> {
    await this.fetchInvites();
  }

  async fetchInvites(): Promise<void> {
    this.isLoadingInvites.set(true);
    this.error.set(null);
    try {
      const fetched = await this.invitesApi.getAllInvites();
      const sorted = (fetched ?? [])
        .slice()
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      this.invites.set(sorted);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Einladungen konnten nicht geladen werden. Bitte versuche es später erneut.'
        )
      );
    } finally {
      this.isLoadingInvites.set(false);
    }
  }

  copyInvite(inv: Invite): void {
    try {
      const url = `${window.location.origin}/invite/redeem/${inv.token}`;
      navigator.clipboard.writeText(url);
      this.copiedInviteId.set(inv.id);
      setTimeout(() => this.copiedInviteId.set(null), 2000);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Der Einladungslink konnte nicht kopiert werden. Bitte kopiere ihn manuell.'
        )
      );
    }
  }

  openDeleteInvite(inv: Invite): void {
    this.error.set(null);
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
    this.error.set(null);
    try {
      await this.invitesApi.deleteInvite(id);
      this.invites.set(this.invites().filter((i) => i.id !== id));
      this.success.set('Einladungslink erfolgreich gelöscht.');
      setTimeout(() => this.success.set(null), 3500);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Die Einladung konnte nicht gelöscht werden. Bitte versuche es später erneut.'
        )
      );
    } finally {
      this.closeDeleteInviteModal();
    }
  }

  handleInviteCreated(inv: Invite): void {
    this.invites.set([inv, ...this.invites()]);
    this.success.set('Neuer Einladungslink erstellt.');
    setTimeout(() => this.success.set(null), 3500);
  }

  shortToken(token: string): string {
    return token ? `${token.slice(0, 3)}...${token.slice(-3)}` : '';
  }
}
