import { Component, NO_ERRORS_SCHEMA, OnInit, inject } from '@angular/core';
import { PageRouterOutlet } from '@nativescript/angular';
import { ThemeService } from './core/services/theme.service';
import { NotificationService } from './core/services/notification.service';

@Component({
  selector: 'ns-app',
  templateUrl: './app.component.html',
  imports: [PageRouterOutlet],
  schemas: [NO_ERRORS_SCHEMA],
})
export class AppComponent implements OnInit {
  // Ensure ThemeService is initialized at app bootstrap
  private readonly themeService = inject(ThemeService);
  private readonly notificationService = inject(NotificationService);

  async ngOnInit(): Promise<void> {
    await this.notificationService.initializeWaterReminderNavigation();
  }
}
