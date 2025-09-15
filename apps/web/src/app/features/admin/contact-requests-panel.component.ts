import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, inject, signal, computed } from '@angular/core';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { ChevronDown, Inbox, Send, Trash } from 'libs/constants/icons';
import { ContactApiService } from '@cooksona/api';
import { Message } from '@cooksona/models/contact.models';
import { DeleteConfirmModalComponent } from '../../components/modals/delete-confirm-modal.component';

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
  ],
  template: `
    <div>
      <div class="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h2 class="text-2xl font-serif font-bold text-neutral">Posteingang</h2>
        <div class="flex items-center gap-2 p-1 bg-base-200 rounded-lg">
          @for (f of filters; track f) {
          <button
            (click)="messageFilter.set(f)"
            class="px-3 py-1 text-sm font-semibold rounded-md transition-colors"
            [ngClass]="
              messageFilter() === f
                ? 'bg-white text-primary shadow-sm'
                : 'text-gray-600 hover:bg-white/50'
            "
          >
            {{ filterLabel(f) }}
          </button>
          }
        </div>
      </div>
      @if (loading()) {
      <div class="flex flex-col items-center justify-center py-16">
        <svg
          class="animate-spin h-10 w-10 text-primary mb-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          ></circle>
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <span class="text-primary text-lg font-semibold"
          >Nachrichten werden geladen ...</span
        >
      </div>
      } @else if (paginatedMessages().length > 0) {
      <div class="space-y-3">
        @for (msg of paginatedMessages(); track msg.id) {
        <div
          class="bg-base-100/30 rounded-lg border border-base-200 overflow-hidden transition-all duration-200"
        >
          <div
            class="flex items-center p-4 cursor-pointer hover:bg-base-200/40"
            (click)="toggleMessage(msg)"
            [attr.aria-expanded]="expandedMessageId() === msg.id"
          >
            <div class="flex-1 grid grid-cols-12 gap-4 items-center">
              <div class="col-span-12 sm:col-span-2">
                {{ statusBadge(msg.status) }}
              </div>
              <div class="col-span-12 sm:col-span-3">
                <span
                  class="px-2 py-1 text-xs font-semibold text-neutral bg-base-200 rounded-full"
                  >{{ requestTypeTranslations[msg.requestType] }}</span
                >
              </div>
              <div class="col-span-12 sm:col-span-5">
                <p class="text-sm text-neutral truncate">{{ msg.message }}</p>
              </div>
              <div class="col-span-12 sm:col-span-2 text-left sm:text-right">
                <span class="text-xs text-gray-500">{{
                  formatDate(msg.createdAt)
                }}</span>
              </div>
            </div>
            <div class="w-10 text-right">
              <span
                class="w-5 h-5 text-gray-400 transition-transform"
                [ngClass]="expandedMessageId() === msg.id ? 'rotate-180' : ''"
                [svgInject]="icons.ChevronDown"
              ></span>
            </div>
          </div>
          @if (expandedMessageId() === msg.id) {
          <div class="p-6 border-t border-base-200 bg-white space-y-4">
            <p class="whitespace-pre-wrap text-neutral leading-relaxed">
              {{ msg.message }}
            </p>
            <div class="mt-4 pt-4 border-t border-base-200/60">
              @if (msg.reply) {
              <div>
                <h4 class="text-sm font-bold text-neutral mb-2">
                  Ihre Antwort:
                </h4>
                <blockquote
                  class="border-l-4 border-primary bg-base-100/50 p-4 text-sm text-gray-700 italic rounded-r-lg"
                >
                  {{ msg.reply }}
                </blockquote>
              </div>
              } @else {
              <div>
                <h4 class="text-sm font-bold text-neutral mb-2">Antworten:</h4>
                <textarea
                  [(ngModel)]="replyText"
                  rows="4"
                  class="w-full p-2 border-2 border-base-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ihre Antwort hier..."
                ></textarea>
                <div class="mt-2 flex justify-end items-center gap-4">
                  <button
                    (click)="openDeleteMessage(msg, $event)"
                    class="p-2 text-gray-500 hover:text-error hover:bg-error/10 rounded-full transition-colors"
                    title="Nachricht löschen"
                  >
                    <span class="w-5 h-5" [svgInject]="icons.Trash"></span>
                  </button>
                  <button
                    (click)="handleReply(msg)"
                    [disabled]="
                      !replyText.trim() || replyLoadingId() === msg.id
                    "
                    class="flex items-center gap-2 bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-focus transition-colors disabled:bg-base-300"
                  >
                    @if (replyLoadingId() === msg.id) {
                    <span
                      class="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></span>
                    } @else {
                    <span class="w-4 h-4" [svgInject]="icons.Send"></span> }
                    Senden
                  </button>
                </div>
              </div>
              }
            </div>
          </div>
          }
        </div>
        }
        <div class="flex justify-center mt-6 gap-2">
          <button
            class="px-3 py-1 rounded bg-base-200 text-gray-700 font-semibold"
            (click)="currentPage.set(currentPage() > 1 ? currentPage() - 1 : 1)"
            [disabled]="currentPage() === 1"
          >
            Zurück
          </button>
          <span class="px-3 py-1 text-sm font-semibold"
            >Seite {{ currentPage() }} von {{ totalPages() }}</span
          >
          <button
            class="px-3 py-1 rounded bg-base-200 text-gray-700 font-semibold"
            (click)="
              currentPage.set(
                currentPage() < totalPages() ? currentPage() + 1 : totalPages()
              )
            "
            [disabled]="currentPage() === totalPages()"
          >
            Weiter
          </button>
        </div>
      </div>
      } @else {
      <div class="text-center py-16">
        <span
          class="mx-auto h-20 w-20 text-base-200 block"
          [svgInject]="icons.Inbox"
        ></span>
        <h3 class="mt-4 text-xl font-semibold text-neutral">
          {{ emptyMessageText() }}
        </h3>
        <p class="text-gray-500 mt-1">
          Nachrichten mit diesem Status erscheinen hier.
        </p>
      </div>
      }

      <app-delete-confirm-modal
        [open]="deleteModalOpen()"
        [title]="'Kontaktanfrage löschen'"
        [message]="'Möchtest du diese Anfrage wirklich löschen?'"
        [details]="deleteTargetMessage() || ''"
        [confirmText]="'Löschen'"
        (cancel)="closeDeleteModal()"
        (confirm)="confirmDelete()"
      />
    </div>
  `,
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
    try {
      const data = await this.contactApi.fetchContactRequests();
      this.messages.set(
        (data ?? []).sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  statusBadge(status: Message['status']): string {
    switch (status) {
      case 'answered':
        return 'Beantwortet';
      case 'read':
        return 'Gelesen';
      default:
        return 'Neu';
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
      await this.contactApi.updateContactRequest(msg.id, { status: 'read' });
      await this.fetchMessages();
    }
  }

  async handleReply(msg: Message): Promise<void> {
    if (!this.replyText.trim()) return;
    this.replyLoadingId.set(msg.id);
    await this.contactApi.updateContactRequest(msg.id, {
      status: 'answered',
      reply: this.replyText.trim(),
    });
    this.replyLoadingId.set(null);
    this.replyText = '';
    this.expandedMessageId.set(null);
    await this.fetchMessages();
  }

  openDeleteMessage(msg: Message, ev: MouseEvent): void {
    ev.stopPropagation();
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
    await this.contactApi.deleteContactRequest(id);
    this.closeDeleteModal();
    await this.fetchMessages();
  }
}
