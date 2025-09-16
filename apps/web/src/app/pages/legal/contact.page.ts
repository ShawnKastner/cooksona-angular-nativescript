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
import { MessageSquare, Send } from 'libs/constants/icons';
import { AuthService } from '@cooksona/auth';
import { ContactApiService } from '@cooksona/api';


type ContactFormModel = {
  requestType: FormControl<'feature' | 'support' | 'feedback' | 'other'>;
  message: FormControl<string>;
  email: FormControl<string>;
};

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SvgInjectDirective,
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

        @if (success) {
        <div
          class="bg-green-100 border-l-4 border-success text-green-800 p-4 rounded-r-lg mb-6"
          role="alert"
        >
          <p class="font-bold">Nachricht gesendet</p>
          <p>{{ success }}</p>
        </div>
        } @if (error) {
        <div
          class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative mb-6"
          role="alert"
        >
          <span class="block sm:inline">{{ error }}</span>
        </div>
        }

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
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5"
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

  readonly icons = { MessageSquare, Send } as const;

  form: FormGroup<ContactFormModel> = this.fb.group<ContactFormModel>({
    requestType: this.fb.control<'feature' | 'support' | 'feedback' | 'other'>(
      'feature',
      {validators: [Validators.required] }
    ),
    message: this.fb.control<string>('', {
      validators: [Validators.required],
    }),
    email: this.fb.control<string>('', {
      validators: [Validators.email],
    }),
  });
  isSending = false;
  error: string | null = null;
  success: string | null = null;

  get currentUserId(): string | null {
    return (this.auth.currentUser as any)?.id ?? null;
  }

  async handleSubmit(): Promise<void> {
    this.error = null;
    this.success = null;
    const val = this.form.getRawValue();
    const msg = val.message.trim();
    if (!msg) {
      this.error = 'Bitte geben Sie eine Nachricht ein.';
      return;
    }
    if (!this.currentUserId && !String(val.email || '').trim()) {
      this.error = 'Bitte geben Sie Ihre E-Mail-Adresse an.';
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
        } as any);
      } else {
        await this.contactApi.createContactRequest({
          email: val.email,
          requestType: val.requestType,
          message: msg,
        } as any);
      }
      this.success =
        'Vielen Dank für Ihre Nachricht! Wir werden uns so schnell wie möglich bei Ihnen melden.';
      // reset
      this.form.patchValue({ message: '', requestType: 'feature', email: '' });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    } catch {
      this.error = 'Fehler beim Senden. Bitte versuchen Sie es später erneut.';
    }
    this.isSending = false;
    this.form.enable({ emitEvent: false });
  }
}
