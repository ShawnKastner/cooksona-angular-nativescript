import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import {
  NativeScriptCommonModule,
  NativeScriptFormsModule,
  RouterExtensions,
} from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { Apple, Google, UserPlus } from '@cooksona/constants/icons';
import { RouterModule } from '@angular/router';
import { Page } from '@nativescript/core';

@Component({
  selector: 'ns-register',
  standalone: true,
  imports: [
    NativeScriptCommonModule,
    ReactiveFormsModule,
    NativeScriptFormsModule,
    SvgToDataUriPipe,
    RouterModule,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  constructor(
    private routerExt: RouterExtensions,
    private page: Page,
  ) {
    this.page.actionBarHidden = true;
  }
  icons = {
    UserPlus,
    Google,
    Apple,
  } as const;

  onLoginTap() {
    // TODO: wire up actual login action
    console.log('Login tapped');
  }

  createAccount() {
    // TODO: implement account creation logic
    console.log('Create account tapped');
  }

  googleSignIn() {
    // TODO: Implement login with google
    console.log('Google signIn tapped');
  }

  appleSignIn() {
    // TODO: Implement login with apple
    console.log('Apple login tapped');
  }

  goToLogin() {
    // Navigate back to login
    this.routerExt.navigateByUrl('/login', { clearHistory: true });
  }
}
