import {
  Component,
  inject,
  ChangeDetectionStrategy,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import { MessageSquare, Send } from '@cooksona/constants/icons';
import { AuthService } from '@cooksona/auth';
import { ContactApiService } from '@cooksona/api';
import { SnackbarService } from '../../../shared/ui/snackbar/snackbar.service';
import { toErrorMessage } from '../../../shared/utils/error.utils';
import { LoadingSpinnerSmallComponent } from '../../../shared/ui/loading-spinner/loading-spinner-small.component';

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
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly auth = inject(AuthService);
  private readonly contactApi = inject(ContactApiService);
  private readonly snackbar = inject(SnackbarService);

  readonly icons = { MessageSquare, Send } as const;

  form: FormGroup<ContactFormModel> = this.fb.group<ContactFormModel>({
    requestType: this.fb.control<'feature' | 'support' | 'feedback' | 'other'>(
      'feature',
      { validators: [Validators.required] },
    ),
    message: this.fb.control<string>('', {
      validators: [Validators.required],
    }),
    email: this.fb.control<string>('', {
      validators: [Validators.email],
    }),
  });
  isSending = signal(false);

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
    this.isSending.set(true);
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
        'Vielen Dank! Wir melden uns so schnell wie möglich.',
      );
      // reset
      this.form.patchValue({ message: '', requestType: 'feature', email: '' });
      this.form.markAsPristine();
      this.form.markAsUntouched();
    } catch (error) {
      this.snackbar.error(
        toErrorMessage(
          error,
          'Fehler beim Senden. Bitte versuchen Sie es später erneut.',
        ),
      );
    } finally {
      this.isSending.set(false);
      this.form.enable({ emitEvent: false });
    }
  }
}
