// apps/web/src/app/pages/legal/contact.page.ts
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';
import { MessageSquare, Send } from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';
import { ContactApiService } from '@cooksona/api';
import { SnackbarService } from '../../shared/ui/snackbar.service';
import { toErrorMessage } from '../../shared/utils/error.utils';
import { LoadingSpinnerSmallComponent } from '../../shared/ui/loading-spinner-small.component';

type ContactFormModel = {
  requestType: FormControl<'feature' | 'support' | 'feedback' | 'other'>;
  message: FormControl<string>;
  email: FormControl<string>;
};

type ContactFormValue = {
  requestType: 'feature' | 'support' | 'feedback' | 'other';
  message: string;
  email: string;
};

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SvgInjectDirective,
    LoadingSpinnerSmallComponent,
  ],
  template: `
    <div class="max-w-2xl mx-auto">
      <div
        class="bg-white shadow-soft-xl rounded-2xl p-8 md:p-10 border border-base-200/50"
      >
        <div class="text-center mb-8">
          <h1
            class="text-4xl font-serif font-bold text-neutral flex items-center justify-center gap-3"
          >
            <span
              class="w-9 h-9 text-primary"
              [svgInject]="icons.MessageSquare"
            ></span>
            Kontakt & Feedback
          </h1>
          <p class="text-gray-500 mt-2">
            Haben Sie eine Frage, einen Vorschlag oder benötigen Sie Hilfe?
          </p>
        </div>

        <form [formGroup]="form" (ngSubmit)="handleSubmit()" class="space-y-6">
          <div>
            <label
              for="requestType"
              class="block text-neutral text-sm font-bold mb-2"
              >Art der Anfrage</label
            >
            <select
              id="requestType"
              formControlName="requestType"
              class="w-full px-4 py-3 bg-base-200 border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-primary transition-all duration-200 text-neutral"
            >
              <option value="feature">Feature-Anfrage</option>
              <option value="support">Support-Anfrage</option>
              <option value="feedback">Allgemeines Feedback</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          @if (!currentUserId) {
          <div>
            <label for="email" class="block text-neutral text-sm font-bold mb-2"
              >Ihre E-Mail-Adresse</label
            >
            <input
              id="email"
              type="email"
              formControlName="email"
              class="w-full px-4 py-3 bg-base-200 border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-primary transition-all duration-200 text-neutral placeholder-gray-500"
              placeholder="Ihre E-Mail-Adresse..."
            />
          </div>
          }

          <div>
            <label
              for="message"
              class="block text-neutral text-sm font-bold mb-2"
              >Ihre Nachricht</label
            >
            <textarea
              id="message"
              rows="6"
              formControlName="message"
              class="w-full px-4 py-3 bg-base-200 border-2 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white focus:border-primary transition-all duration-200 text-neutral placeholder-gray-500"
              placeholder="Beschreiben Sie hier Ihr Anliegen..."
            ></textarea>
          </div>

          <div>
            <button
              type="submit"
              [disabled]="isSending || !form.get('message')?.value?.trim()"
              class="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3 px-4 rounded-xl hover:bg-primary-focus focus:outline-none focus:ring-4 focus:ring-primary/40 transition-all duration-300 disabled:bg-base-300"
            >
              @if (isSending) {
              <app-loading-spinner-small />
              Senden... } @else {
              <span class="w-5 h-5" [svgInject]="icons.Send"></span>
              Nachricht senden }
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly contactApi = inject(ContactApiService);
  private readonly snackbar = inject(SnackbarService);

  readonly icons = { MessageSquare, Send } as const;

  form: FormGroup<ContactFormModel> = this.fb.group<ContactFormModel>({
    requestType: this.fb.control<'feature' | 'support' | 'feedback' | 'other'>(
      'feature',
      { validators: [Validators.required] }
    ),
    message: this.fb.control<string>('', {
      validators: [Validators.required],
    }),
    email: this.fb.control<string>('', {
      validators: [Validators.email],
    }),
  });
  isSending = false;

  get currentUserId(): string | null {
    return this.auth.currentUser?.id ?? null;
  }

  async handleSubmit(): Promise<void> {
    const val: ContactFormValue = this.form.getRawValue();
    const msg = val.message.trim();
    if (!msg) {
      this.snackbar.error('Bitte geben Sie eine Nachricht ein.');
      return;
    }
    if (!this.currentUserId && !String(val.email || '').trim()) {
      this.snackbar.error('Bitte geben Sie Ihre E-Mail-Adresse an.');
      return;
    }
    this.isSending = true;
    this.form.disable({ emitEvent: false });
    try {
      if (this.currentUserId) {
        await this.contactApi.createContactRequest({
          userId: this.currentUserId,
          requestType: val.requestType,
          message: msg,
        });
      } else {
        await this.contactApi.createContactRequest({
          email: val.email.trim(),
          requestType: val.requestType,
          message: msg,
        });
      }
      this.snackbar.success(
        'Vielen Dank! Wir melden uns so schnell wie möglich.'
      );
      // reset
      this.form.patchValue({ message: '', requestType: 'feature', email: '' });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    } catch (error) {
      this.snackbar.error(
        toErrorMessage(
          error,
          'Fehler beim Senden. Bitte versuchen Sie es später erneut.'
        )
      );
    } finally {
      this.isSending = false;
      this.form.enable({ emitEvent: false });
    }
  }
}
