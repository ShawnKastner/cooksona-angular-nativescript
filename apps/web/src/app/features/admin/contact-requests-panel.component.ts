import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from '@angular/core';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { ChevronDown, Inbox, Send, Trash } from '@cooksona/constants/icons';
import { ContactApiService } from '@cooksona/api';
import { Message } from '@cooksona/models/contact.models';
import { DeleteConfirmModalComponent } from '../../shared/ui/modals/delete-confirm-modal.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { toErrorMessage } from '../../shared/utils/error.utils';

type MessageFilter = 'all' | 'unread' | 'read' | 'answered';
const PAGE_SIZE = 5;

@Component({
  selector: 'app-contact-requests-panel',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SvgInjectDirective,
    DeleteConfirmModalComponent,
    PaginationComponent,
  ],
  templateUrl: './contact-requests-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactRequestsPanelComponent {
  private readonly contactApi = inject(ContactApiService);

  icons = { ChevronDown, Inbox, Send, Trash } as const;
  loading = signal(false);
  messages = signal<Message[]>([]);
  expandedMessageId = signal<string | null>(null);
  replyText = '';
  replyLoadingId = signal<string | null>(null);
  messageFilter = signal<MessageFilter>('all');
  currentPage = signal(1);
  deleteModalOpen = signal(false);
  deleteTargetId = signal<string | null>(null);
  deleteTargetMessage = signal<string | undefined>(undefined);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  filters: MessageFilter[] = ['all', 'unread', 'read', 'answered'];
  requestTypeTranslations: Record<Message['requestType'], string> = {
    feature: 'Feature-Anfrage',
    support: 'Support-Anfrage',
    feedback: 'Feedback',
    other: 'Sonstiges',
  } as const;

  constructor() {
    void this.fetchMessages();
  }

  async fetchMessages(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await this.contactApi.fetchContactRequests();
      this.messages.set(
        (data ?? []).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Die Kontaktanfragen konnten nicht geladen werden. Bitte versuche es später erneut.'
        )
      );
    } finally {
      this.loading.set(false);
    }
  }

  formatDate(iso: string): string {
    try {
      return new Date(iso).toLocaleDateString('de-DE');
    } catch {
      return iso;
    }
  }

  filterLabel(f: MessageFilter): string {
    return {
      all: 'Alle',
      unread: 'Neu',
      read: 'Gelesen',
      answered: 'Beantwortet',
    }[f];
  }

  paginatedMessages = computed(() => {
    const filtered =
      this.messageFilter() === 'all'
        ? this.messages()
        : this.messages().filter((m) => m.status === this.messageFilter());
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  });
  totalPages = computed(() => {
    const filtered =
      this.messageFilter() === 'all'
        ? this.messages()
        : this.messages().filter((m) => m.status === this.messageFilter());
    return Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  });

  emptyMessageText(): string {
    switch (this.messageFilter()) {
      case 'unread':
        return 'Keine neuen Nachrichten vorhanden.';
      case 'read':
        return 'Keine gelesenen Nachrichten vorhanden.';
      case 'answered':
        return 'Keine beantworteten Nachrichten vorhanden.';
      default:
        return 'Der Posteingang ist leer.';
    }
  }

  async toggleMessage(msg: Message): Promise<void> {
    const isExpanded = this.expandedMessageId() === msg.id;
    this.expandedMessageId.set(isExpanded ? null : msg.id);
    this.replyText = '';
    if (!isExpanded && msg.status === 'unread') {
      try {
        await this.contactApi.updateContactRequest(msg.id, { status: 'read' });
        await this.fetchMessages();
      } catch (error) {
        await this.fetchMessages();
        this.error.set(
          toErrorMessage(
            error,
            'Die Nachricht konnte nicht als gelesen markiert werden. Bitte versuche es später erneut.'
          )
        );
      }
    }
  }

  async handleReply(msg: Message): Promise<void> {
    if (!this.replyText.trim()) return;
    this.replyLoadingId.set(msg.id);
    this.error.set(null);
    try {
      await this.contactApi.updateContactRequest(msg.id, {
        status: 'answered',
        reply: this.replyText.trim(),
      });
      this.replyText = '';
      this.expandedMessageId.set(null);
      await this.fetchMessages();
      this.success.set('Antwort wurde gesendet.');
      setTimeout(() => this.success.set(null), 3500);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Die Antwort konnte nicht gesendet werden. Bitte versuche es später erneut.'
        )
      );
    } finally {
      this.replyLoadingId.set(null);
    }
  }

  openDeleteMessage(msg: Message, ev: MouseEvent): void {
    ev.stopPropagation();
    this.error.set(null);
    this.deleteTargetId.set(msg.id);
    this.deleteTargetMessage.set(msg.message);
    this.deleteModalOpen.set(true);
  }
  closeDeleteModal(): void {
    this.deleteModalOpen.set(false);
    this.deleteTargetId.set(null);
    this.deleteTargetMessage.set(undefined);
  }
  async confirmDelete(): Promise<void> {
    const id = this.deleteTargetId();
    if (!id) return;
    this.error.set(null);
    try {
      await this.contactApi.deleteContactRequest(id);
      this.closeDeleteModal();
      await this.fetchMessages();
      this.success.set('Die Nachricht wurde gelöscht.');
      setTimeout(() => this.success.set(null), 3500);
    } catch (error) {
      this.error.set(
        toErrorMessage(
          error,
          'Die Nachricht konnte nicht gelöscht werden. Bitte versuche es später erneut.'
        )
      );
    }
  }
}
