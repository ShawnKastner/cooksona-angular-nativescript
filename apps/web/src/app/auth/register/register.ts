import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserPlus } from 'libs/constants/icons';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, SvgInjectDirective],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  error: string | null = null;
  isLoading = false;
  protected readonly icons = { UserPlus } as const;

  async submit() {
    this.error = null;
    if (this.password.length < 8) {
      this.error = 'Das Passwort muss mindestens 8 Zeichen haben.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Die Passwörter stimmen nicht überein.';
      return;
    }
    this.isLoading = true;
    try {
      // TODO: register API call
      await new Promise((r) => setTimeout(r, 800));
      // redirect to login or show message
    } finally {
      this.isLoading = false;
    }
  }
}
