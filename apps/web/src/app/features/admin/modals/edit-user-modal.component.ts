import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnChanges,
} from '@angular/core';
import {
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { SvgInjectDirective } from '../../../shared/directives/svg-inject.directive';
import {
  X,
  User as UserIcon,
  Shield,
  Star,
  Check,
} from '@cooksona/constants/icons';
import { User } from '@cooksona/models/user.models';

type EditUserFormControls = {
  role: FormControl<'admin' | 'user'>;
  subscriptionEndsAt: FormControl<string>;
  lifetimeSubscription: FormControl<boolean>;
};

type EditUserFormValue = {
  role: 'admin' | 'user';
  subscriptionEndsAt: string;
  lifetimeSubscription: boolean;
};

@Component({
  selector: 'app-edit-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SvgInjectDirective],
  template: `
    @if (open && user) {
    <div
      class="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4"
      (click)="close.emit()"
    >
      <div
        class="bg-base-100 rounded-2xl w-full max-w-lg"
        (click)="$event.stopPropagation()"
      >
        <header class="p-6 border-b flex justify-between">
          <div>
            <h2
              class="text-3xl font-serif font-bold text-neutral flex items-center gap-3"
            >
              <span
                class="w-7 h-7 text-primary"
                [svgInject]="icons.UserIcon"
              ></span>
              Benutzer bearbeiten
            </h2>
            <p class="text-gray-500 text-sm mt-1">{{ user.email }}</p>
          </div>
          <button
            (click)="close.emit()"
            class="p-2 rounded-full text-gray-400 hover:bg-base-200 hover:text-neutral"
          >
            <span class="w-6 h-6" [svgInject]="icons.X"></span>
          </button>
        </header>
        <form
          [formGroup]="form"
          (ngSubmit)="submit()"
          class="p-6 md:p-8 space-y-6"
        >
          <div>
            <label
              class="block text-sm font-bold text-neutral mb-2 flex items-center gap-2"
              ><span class="w-4 h-4" [svgInject]="icons.Shield"></span
              >Rolle</label
            >
            <select
              formControlName="role"
              class="w-full px-4 py-3 bg-white border-2 border-base-200 rounded-xl"
            >
              <option value="user">Benutzer</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <div>
            <label
              class="block text-sm font-bold text-neutral mb-2 flex items-center gap-2"
              ><span class="w-4 h-4" [svgInject]="icons.Star"></span
              >Abonnement</label
            >
            <div class="space-y-4">
              <div>
                <label
                  class="block text-sm font-bold text-neutral mb-2"
                  for="subscriptionEndsAt"
                  >Abonnement endet am</label
                >
                <input
                  id="subscriptionEndsAt"
                  type="date"
                  class="w-full px-4 py-3 bg-base-200 border-2 border-base-200 rounded-xl"
                  formControlName="subscriptionEndsAt"
                  [disabled]="lifetimeSelected"
                />
              </div>
              <div>
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    class="h-5 w-5 rounded-md border-gray-300 text-primary focus:ring-primary"
                    formControlName="lifetimeSubscription"
                  />
                  <span class="text-sm font-medium text-neutral"
                    >Lebenslanges Abonnement</span
                  >
                </label>
              </div>
            </div>
          </div>
          <div class="pt-4 flex justify-end gap-3">
            <button
              type="button"
              (click)="close.emit()"
              class="bg-gray-200 text-gray-800 font-bold py-2.5 px-6 rounded-xl"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              class="flex items-center gap-2 bg-primary text-white font-bold py-2.5 px-6 rounded-xl"
            >
              <span class="w-5 h-5" [svgInject]="icons.Check"></span>
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
    }
  `,
})
export class EditUserModalComponent implements OnChanges {
  @Input() open = false;
  @Input() user: User | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<Pick<User, 'id'> & Partial<User>>();

  form: FormGroup<EditUserFormControls>;
  readonly icons = { X, UserIcon, Shield, Star, Check } as const;

  constructor() {
    this.form = new FormGroup<EditUserFormControls>({
      role: new FormControl<'admin' | 'user'>('user', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      subscriptionEndsAt: new FormControl<string>('', {
        nonNullable: true,
      }),
      lifetimeSubscription: new FormControl<boolean>(false, {
        nonNullable: true,
      }),
    });
  }

  ngOnChanges(): void {
    const u = this.user;
    if (!u) return;
    const dateStr = u.subscriptionEndsAt
      ? new Date(u.subscriptionEndsAt).toISOString().split('T')[0]
      : '';
    this.form.patchValue(
      {
        role: (u.role as 'admin' | 'user') || 'user',
        subscriptionEndsAt: dateStr,
        lifetimeSubscription: !!u.lifetimeSubscription,
      },
      { emitEvent: false }
    );
  }

  get lifetimeSelected(): boolean {
    return this.form.controls.lifetimeSubscription.value;
  }

  submit(): void {
    const val: EditUserFormValue = this.form.getRawValue();
    if (!this.user?.id) return;
    const payload: Pick<User, 'id'> & Partial<User> = {
      id: this.user.id,
      role: val.role,
      subscriptionEndsAt: this.lifetimeSelected
        ? undefined
        : val.subscriptionEndsAt || undefined,
      lifetimeSubscription: val.lifetimeSubscription,
    };
    this.save.emit(payload);
  }
}
