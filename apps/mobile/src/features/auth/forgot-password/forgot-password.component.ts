import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
  RouterExtensions,
} from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Mail } from '@cooksona/constants/icons';
import { Page } from '@nativescript/core';

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
    private routerExt: RouterExtensions,
    private page: Page,
  ) {
    this.page.actionBarHidden = true;
  }

  goBack() {
    this.routerExt.navigateByUrl('/login', { clearHistory: true });
  }

  resetPassword() {
    // TODO: Implement password reset logic
    console.log('Reset password tapped');
  }
}
