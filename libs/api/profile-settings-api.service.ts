import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import {
  NutritionSettings,
  CreateNutritionSettingsDto,
  UpdateNutritionSettingsDto,
  PlanPersonalization,
  CreatePlanPersonalizationDto,
  UpdatePlanPersonalizationDto,
  NotificationSettings,
  CreateNotificationSettingsDto,
  UpdateNotificationSettingsDto,
} from '@cooksona/models';

@Injectable({
  providedIn: 'root',
})
export class ProfileSettingsApiService {
  constructor(private readonly api: ApiService) {}

  // Nutrition Settings
  getNutritionSettings(): Promise<NutritionSettings | undefined> {
    return this.api.get<NutritionSettings>('/profile/nutrition-settings');
  }

  createNutritionSettings(
    dto: CreateNutritionSettingsDto,
  ): Promise<NutritionSettings | undefined> {
    return this.api.post<NutritionSettings>('/profile/nutrition-settings', dto);
  }

  updateNutritionSettings(
    dto: UpdateNutritionSettingsDto,
  ): Promise<NutritionSettings | undefined> {
    return this.api.put<NutritionSettings>('/profile/nutrition-settings', dto);
  }

  deleteNutritionSettings(): Promise<void> {
    return this.api.delete('/profile/nutrition-settings');
  }

  // Plan Personalization
  getPlanPersonalization(): Promise<PlanPersonalization | undefined> {
    return this.api.get<PlanPersonalization>('/profile/plan-personalization');
  }

  createPlanPersonalization(
    dto: CreatePlanPersonalizationDto,
  ): Promise<PlanPersonalization | undefined> {
    return this.api.post<PlanPersonalization>(
      '/profile/plan-personalization',
      dto,
    );
  }

  updatePlanPersonalization(
    dto: UpdatePlanPersonalizationDto,
  ): Promise<PlanPersonalization | undefined> {
    return this.api.put<PlanPersonalization>(
      '/profile/plan-personalization',
      dto,
    );
  }

  deletePlanPersonalization(): Promise<void> {
    return this.api.delete('/profile/plan-personalization');
  }

  // Notification Settings
  getNotificationSettings(): Promise<NotificationSettings | undefined> {
    return this.api.get<NotificationSettings>('/profile/notification-settings');
  }

  createNotificationSettings(
    dto: CreateNotificationSettingsDto,
  ): Promise<NotificationSettings | undefined> {
    return this.api.post<NotificationSettings>(
      '/profile/notification-settings',
      dto,
    );
  }

  updateNotificationSettings(
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings | undefined> {
    return this.api.put<NotificationSettings>(
      '/profile/notification-settings',
      dto,
    );
  }

  deleteNotificationSettings(): Promise<void> {
    return this.api.delete('/profile/notification-settings');
  }
}
