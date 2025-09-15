import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  FormGroup,
} from '@angular/forms';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { X, Check, Shield, Clipboard } from 'libs/constants/icons';
import { InvitesApiService } from '@cooksona/api';
import { Invite } from '@cooksona/models/invite.models';

@Component({
  selector: 'app-create-invite-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SvgInjectDirective],
  template: `
    @if (open) {
    <div
      class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      (click)="close.emit()"
    >
      <div
        class="bg-base-100 rounded-2xl w-full max-w-lg relative"
        (click)="$event.stopPropagation()"
      >
        <header class="p-6 border-b flex items-center gap-2">
          <h2 class="text-2xl font-serif font-bold">
            Einladungslink erstellen
          </h2>
          <span class="text-gray-500 text-base"
            >Konfiguriere einen neuen Einladungslink.</span
          >
          <button (click)="close.emit()" class="absolute top-6 right-6">
            <span class="w-5 h-5" [svgInject]="icons.X"></span>
          </button>
        </header>
        @if (invite) {
        <div class="p-6 space-y-6">
          <div
            class="bg-green-100 border border-green-300 rounded-lg px-4 py-3 flex items-center gap-3"
          >
            <span
              class="w-6 h-6 text-green-600"
              [svgInject]="icons.Check"
            ></span>
            <span class="text-green-700 font-semibold"
              >Einladungslink erfolgreich erstellt!</span
            >
          </div>
          <div class="space-y-2">
            <label class="block text-base font-bold mb-1" for="inviteLink"
              >Generierter Link:</label
            >
            <div class="flex gap-2 items-center">
              <input
                id="inviteLink"
                type="text"
                class="flex-1 border border-gray-200 bg-gray-50 rounded-xl px-4 py-2 text-gray-700 text-base font-mono"
                [value]="inviteUrl(invite)"
                readonly
                disabled
              />
              <button
                type="button"
                class="bg-yellow-200 text-yellow-900 font-bold px-4 py-2 rounded-xl transition-colors hover:bg-yellow-300"
                (click)="copy(invite)"
              >
                Kopieren
              </button>
            </div>
          </div>
          <div class="pt-4">
            <button
              class="w-full bg-gray-100 text-gray-900 font-bold px-4 py-3 rounded-xl text-lg"
              (click)="resetForm()"
            >
              Weiteren Link erstellen
            </button>
          </div>
        </div>
        } @else {
        <form [formGroup]="form" (ngSubmit)="submit()" class="p-6 space-y-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-bold mb-1" for="role"
                >Rolle</label
              >
              <select
                id="role"
                formControlName="role"
                class="w-full border p-2 rounded"
              >
                <option value="user">Benutzer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold mb-1" for="maxUses"
                >Max. Nutzungen</label
              >
              <input
                id="maxUses"
                type="number"
                min="1"
                formControlName="maxUses"
                class="w-full border p-2 rounded"
                placeholder="z.B. 1"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-1" for="expiresAt"
                >Gültig bis</label
              >
              <input
                id="expiresAt"
                type="datetime-local"
                formControlName="expiresAt"
                class="w-full border p-2 rounded"
              />
            </div>
            <div>
              <label class="block text-sm font-bold mb-1" for="description"
                >Beschreibung (optional)</label
              >
              <input
                id="description"
                type="text"
                formControlName="description"
                class="w-full border p-2 rounded"
                maxlength="200"
                placeholder="z.B. Max Mustermann, Testlink, ..."
              />
            </div>
          </div>
          <div class="flex gap-2 pt-4">
            <button
              type="button"
              (click)="close.emit()"
              class="flex-1 px-4 py-2 rounded bg-gray-200"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-2 rounded bg-primary text-white font-bold flex items-center justify-center gap-2"
            >
              <span class="w-4 h-4" [svgInject]="icons.Check"></span>
              Link generieren
            </button>
          </div>
        </form>
        }
      </div>
    </div>
    }
  `,
})
export class CreateInviteModalComponent {
  @Input() open = false;
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<Invite>();

  form: FormGroup;
  invite: Invite | null = null;
  readonly icons = { X, Check, Shield, Clipboard } as const;

  constructor(
    private readonly fb: FormBuilder,
    private readonly invitesApi: InvitesApiService
  ) {
    this.form = this.fb.group({
      role: ['user', Validators.required],
      maxUses: [1, [Validators.min(1)]],
      expiresAt: [''],
      description: [''],
    });
  }

  inviteUrl(inv: Invite): string {
    return `${window.location.origin}/invite/redeem/${inv.token}`;
  }
  copy(inv: Invite): void {
    try {
      navigator.clipboard.writeText(this.inviteUrl(inv));
    } catch {}
  }
  resetForm(): void {
    this.invite = null;
    this.form.reset({
      role: 'user',
      maxUses: 1,
      expiresAt: '',
      description: '',
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const raw = this.form.value as any;
    const payload: any = {
      role: raw.role,
      maxUses: raw.maxUses ? Number(raw.maxUses) : undefined,
      description: raw.description || undefined,
      expiresAt: raw.expiresAt
        ? new Date(raw.expiresAt).toISOString()
        : undefined,
    };
    const created = await this.invitesApi.createInvite(payload);
    if (created) {
      this.invite = created;
      this.created.emit(created);
    }
  }
}
