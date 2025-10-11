import { Component, NO_ERRORS_SCHEMA, inject, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { ModalDialogParams } from '@nativescript/angular';
import { X } from '@cooksona/constants/icons';
import { isIOS } from '@nativescript/core';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { HealthKitService } from '../../../plugins/healthkit/healthkit.service';
import { ApplicationSettings } from '@nativescript/core';

@Component({
  selector: 'ns-health-connection-modal',
  templateUrl: './health-connection-modal.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class HealthConnectionModalComponent {
  private params = inject(ModalDialogParams);
  private health = inject(HealthKitService);

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

    try {
      if (this.isIOS) {
        if (!this.health.isAvailable()) {
          throw new Error('Apple Health ist auf diesem Gerät nicht verfügbar.');
        }

        // Request authorization
        await this.health.requestAuthorization();

        // Save the connection status persistently
        ApplicationSettings.setBoolean('healthkit_connected', true);

        // Return success
        this.params.closeCallback(true);
      } else {
        // TODO: Implement Google Fit later
        throw new Error('Google Fit wird bald unterstützt.');
      }
    } catch (error) {
      console.error('Failed to connect health service:', error);
      this.loading.set(false);
      // Return failure
      this.params.closeCallback(false);
    }
  }
}
