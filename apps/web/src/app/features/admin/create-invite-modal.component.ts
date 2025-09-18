import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { X, Check } from '@cooksona/constants/icons';
import { InvitesApiService } from '@cooksona/api';
import {
  CreateInviteRequest,
  Invite,
  InviteRole,
} from '@cooksona/models/invite.models';
import { toErrorMessage } from '../../shared/utils/error.utils';

type InviteFormControls = {
  presetRole: FormControl<InviteRole>;
  isLifetime: FormControl<boolean>;
  subscriptionEndsAt: FormControl<string>;
  expiryDays: FormControl<number>;
  description: FormControl<string>;
};

type InviteFormValue = {
  presetRole: InviteRole;
  isLifetime: boolean;
  subscriptionEndsAt: string;
  expiryDays: number;
  description: string;
};

type CreateInvitePayload = {
  presetRole: InviteRole;
  isLifetime: boolean;
  expiryDays: number;
  description?: string;
  subscriptionEndsAt?: string;
};

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
        @if (errorMsg) {
        <div class="px-6 pt-4">
          <div
            class="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm"
          >
            {{ errorMsg }}
          </div>
        </div>
        } @if (invite) {
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
              @if (!copied) {
              <button
                type="button"
                class="bg-yellow-200 text-yellow-900 font-bold px-4 py-2 rounded-xl transition-colors hover:bg-yellow-300"
                (click)="handleCopy(invite)"
              >
                Kopieren
              </button>
              } @else {
              <button
                type="button"
                class="bg-green-600 text-white font-bold px-4 py-2 rounded-xl"
                disabled
              >
                Kopiert!
              </button>
              }
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
              <label class="block text-sm font-bold mb-1" for="presetRole"
                >Rolle</label
              >
              <select
                id="presetRole"
                formControlName="presetRole"
                class="w-full border p-2 rounded"
              >
                <option value="user">Benutzer</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold mb-1"
                >Abo-Typ bei Registrierung</label
              >
              <div class="flex items-center gap-3 mb-2">
                <input
                  id="isLifetime"
                  type="checkbox"
                  formControlName="isLifetime"
                />
                <label for="isLifetime" class="text-sm">Lifetime</label>
              </div>
              @if (!form.value.isLifetime) {
              <div>
                <label
                  class="block text-xs font-medium mb-1"
                  for="subscriptionEndsAt"
                  >Enddatum</label
                >
                <input
                  id="subscriptionEndsAt"
                  type="datetime-local"
                  formControlName="subscriptionEndsAt"
                  class="w-full border p-2 rounded"
                  [required]="!form.value.isLifetime"
                />
              </div>
              }
            </div>
            <div>
              <label class="block text-sm font-bold mb-1" for="expiryDays"
                >Gültigkeit</label
              >
              <input
                id="expiryDays"
                type="number"
                min="1"
                formControlName="expiryDays"
                class="w-full border p-2 rounded"
                placeholder="7 Tage"
                required
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
              [disabled]="submitting || form.invalid"
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

  form: FormGroup<InviteFormControls>;
  invite: Invite | null = null;
  copied = false;
  readonly icons = { X, Check } as const;
  errorMsg = '';
  submitting = false;

  constructor(private readonly invitesApi: InvitesApiService) {
    this.form = new FormGroup<InviteFormControls>({
      presetRole: new FormControl<InviteRole>('user', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      isLifetime: new FormControl<boolean>(false, {
        nonNullable: true,
      }),
      subscriptionEndsAt: new FormControl<string>('', {
        nonNullable: true,
      }),
      expiryDays: new FormControl<number>(7, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(1)],
      }),
      description: new FormControl<string>('', {
        nonNullable: true,
      }),
    });

    // Clear optional date and disable when Lifetime toggled on (UX + safety)
    this.form.controls.isLifetime.valueChanges.subscribe((isLifetime) => {
      const ctrl = this.form.controls.subscriptionEndsAt;
      if (isLifetime) {
        ctrl.setValue('');
        ctrl.disable({ emitEvent: false });
      } else {
        ctrl.enable({ emitEvent: false });
      }
    });
  }

  inviteUrl(inv: Invite): string {
    return `${window.location.origin}/invite/redeem/${inv.token}`;
  }
  handleCopy(inv: Invite): void {
    try {
      this.errorMsg = '';
      navigator.clipboard.writeText(this.inviteUrl(inv));
      this.copied = true;
    } catch (error) {
      this.errorMsg = toErrorMessage(
        error,
        'Der Link konnte nicht kopiert werden. Bitte kopiere ihn manuell.'
      );
    }
  }
  resetForm(): void {
    this.invite = null;
    this.copied = false;
    this.errorMsg = '';
    this.form.reset({
      presetRole: 'user',
      isLifetime: false,
      subscriptionEndsAt: '',
      expiryDays: 7,
      description: '',
    });
    this.form.controls.subscriptionEndsAt.enable({ emitEvent: false });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    const raw: InviteFormValue = this.form.getRawValue();
    const payload: CreateInvitePayload = {
      presetRole: raw.presetRole,
      isLifetime: raw.isLifetime,
      expiryDays: Number(raw.expiryDays),
      description: raw.description.trim() || undefined,
    };
    if (!raw.isLifetime && raw.subscriptionEndsAt) {
      payload.subscriptionEndsAt = new Date(raw.subscriptionEndsAt).toISOString();
    }
    this.errorMsg = '';
    this.submitting = true;
    try {
      // Server expects React-style fields; pass through as-is
      let created = await this.invitesApi.createInvite(
        payload as unknown as CreateInviteRequest
      );
      if (!created) {
        // Fallback: fetch latest invite if server responded without body
        const list = await this.invitesApi.getAllInvites();
        if (list && list.length) {
          created = list
            .slice()
            .sort(
              (a, b) =>
                new Date(b.createdAt).getTime() -
                new Date(a.createdAt).getTime()
            )[0];
        }
      }
      if (created) {
        this.invite = created;
        this.created.emit(created);
        this.errorMsg = '';
      }
    } catch (error) {
      this.errorMsg = toErrorMessage(
        error,
        'Der Einladungslink konnte nicht erstellt werden. Bitte versuche es später erneut.'
      );
    } finally {
      this.submitting = false;
    }
  }
}
