import { Component, NO_ERRORS_SCHEMA, inject, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { ModalDialogParams } from '@nativescript/angular';
import { X } from '@cooksona/constants/icons';
import { isIOS } from '@nativescript/core';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

@Component({
  selector: 'ns-health-connection-modal',
  templateUrl: './health-connection-modal.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HealthConnectionModalComponent {
  private params = inject(ModalDialogParams);

  protected readonly icons = {
    X,
  } as const;

  protected readonly isIOS = isIOS;
  protected loading = signal(false);

  get platformName(): string {
    return this.isIOS ? 'Apple Health' : 'Google Fit';
  }

  protected close() {
    this.params.closeCallback(false);
  }

  protected async connect() {
    this.loading.set(true);
    // Return true to indicate user wants to connect
    this.params.closeCallback(true);
  }
}
