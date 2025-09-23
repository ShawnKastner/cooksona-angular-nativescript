import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
} from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Apple, Google, LogIn } from '@cooksona/constants/icons';
import { Router, RouterModule } from '@angular/router';
import { Page } from '@nativescript/core';

@Component({
  selector: 'ns-login',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    ReactiveFormsModule,
    NativeScriptFormsModule,
    SvgToDataUriPipe,
    RouterModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  constructor(
    private router: Router,
    private page: Page,
  ) {
    // Hide native navigation bar on this screen (removes the blue iOS back arrow)
    this.page.actionBarHidden = true;
  }
  icons = {
    LogIn,
    Google,
    Apple,
  } as const;

  onLoginTap() {
    // TODO: wire up actual login action
    console.log('Login tapped');
  }

  googleSignIn() {
    // TODO: Implement login with google
    console.log('Google signIn tapped');
  }

  appleSignIn() {
    // TODO: Implement login with apple
    console.log('Apple login tapped');
  }

  goToRegister() {
    // Navigate to the register screen
    console.log('Tapped');

    this.router.navigateByUrl('/register');
  }

  goToForgotPassword() {
    this.router.navigateByUrl('/forgot-password');
  }
}
