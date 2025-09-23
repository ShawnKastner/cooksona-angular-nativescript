import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Page } from '@nativescript/core';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Mail } from '@cooksona/constants/icons';

@Component({
  selector: 'ns-forgot-password',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    ReactiveFormsModule,
    NativeScriptFormsModule,
    SvgToDataUriPipe,
    RouterModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  icons = { Mail } as const;

  constructor(
    private router: Router,
    private page: Page,
  ) {
    // Hide native nav bar for custom header UI
    this.page.actionBarHidden = true;
  }

  goBack() {
    this.router.navigateByUrl('/login');
  }

  resetPassword() {
    // TODO: Implement password reset logic
    console.log('Reset password tapped');
  }
}
