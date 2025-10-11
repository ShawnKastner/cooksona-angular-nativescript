import { Injectable, inject, signal, computed } from '@angular/core';
import { ProfileSettingsApiService } from '@cooksona/api';
import {
  NutritionSettings,
  PlanPersonalization,
  PreferredMeal,
  UpdateNutritionSettingsDto,
  UpdatePlanPersonalizationDto,
  KitchenEquipment,
} from '@cooksona/models';

@Injectable({
  providedIn: 'root',
})
export class ProfileSettingsStore {
  private readonly api = inject(ProfileSettingsApiService);

  // State
  private readonly nutritionSettings = signal<NutritionSettings | null>(null);
  private readonly planPersonalization = signal<PlanPersonalization | null>(
    null,
  );
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);

  // Selectors
  readonly nutrition$ = computed(() => this.nutritionSettings());
  readonly personalization$ = computed(() => this.planPersonalization());
  readonly loading$ = computed(() => this.loading());
  readonly error$ = computed(() => this.error());

  // Computed values for UI
  readonly dietWishes$ = computed(
    () => this.nutritionSettings()?.dietWishes || 'Keine Angabe',
  );
  readonly allergies$ = computed(
    () => this.nutritionSettings()?.allergies || 'Keine Angabe',
  );
  readonly personCount$ = computed(
    () => this.nutritionSettings()?.personCount || '-',
  );
  readonly preferredMeals$ = computed(() => {
    const meals = this.nutritionSettings()?.preferredMeals;
    if (!meals || meals.length === 0) return 'Keine Angabe';
    return this.formatPreferredMeals(meals);
  });

  readonly favoriteIngredients$ = computed(() => {
    const ingredients = this.planPersonalization()?.favoriteIngredients || [];
    return ingredients.length > 0 ? ingredients.join(', ') : '';
  });

  readonly excludedIngredients$ = computed(() => {
    const ingredients = this.planPersonalization()?.excludedIngredients || [];
    return ingredients.length > 0 ? ingredients.join(', ') : '';
  });

  readonly kitchenEquipment$ = computed(() => {
    const equipment = this.planPersonalization()?.kitchenEquipment || [];
    return equipment;
  });

  readonly kitchenEquipmentDisplay$ = computed(() => {
    const equipment = this.planPersonalization()?.kitchenEquipment || [];
    if (!equipment || equipment.length === 0) return 'Keine Angabe';

    return this.formatKitchenEquipment(equipment);
  });

  // Load data
  async loadNutritionSettings() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const settings = await this.api.getNutritionSettings();
      if (settings) {
        this.nutritionSettings.set(settings);
      }
    } catch (err: any) {
      // If 404: Settings don't exist yet, create with defaults
      if (err.status === 404) {
        console.log('Nutrition settings not found, creating with defaults...');
        try {
          const defaultSettings = {
            dietWishes: '',
            allergies: '',
            personCount: 2,
            preferredMeals: [
              PreferredMeal.BREAKFAST,
              PreferredMeal.LUNCH,
              PreferredMeal.DINNER,
            ],
          };
          const created =
            await this.api.createNutritionSettings(defaultSettings);
          if (created) {
            this.nutritionSettings.set(created);
          }
        } catch (createErr: any) {
          this.error.set(
            createErr.message || 'Fehler beim Erstellen der Einstellungen',
          );
          console.error('Error creating nutrition settings:', createErr);
        }
      } else {
        this.error.set(err.message || 'Fehler beim Laden der Einstellungen');
        console.error('Error loading nutrition settings:', err);
      }
    } finally {
      this.loading.set(false);
    }
  }

  async loadPlanPersonalization() {
    this.loading.set(true);
    this.error.set(null);

    try {
      const settings = await this.api.getPlanPersonalization();
      if (settings) {
        this.planPersonalization.set(settings);
      }
    } catch (err: any) {
      // If 404: Settings don't exist yet, create with defaults
      if (err.status === 404) {
        console.log(
          'Plan personalization not found, creating with defaults...',
        );
        try {
          const defaultSettings = {
            favoriteIngredients: [],
            excludedIngredients: [],
            kitchenEquipment: [],
          };
          const created =
            await this.api.createPlanPersonalization(defaultSettings);
          if (created) {
            this.planPersonalization.set(created);
          }
        } catch (createErr: any) {
          this.error.set(
            createErr.message || 'Fehler beim Erstellen der Einstellungen',
          );
          console.error('Error creating plan personalization:', createErr);
        }
      } else {
        this.error.set(err.message || 'Fehler beim Laden der Einstellungen');
        console.error('Error loading plan personalization:', err);
      }
    } finally {
      this.loading.set(false);
    }
  }

  // Update methods
  async updatePersonCount(count: number) {
    const current = this.nutritionSettings();

    // Build clean DTO - only include the fields the backend expects
    const dto: UpdateNutritionSettingsDto = {
      personCount: count,
    };

    // Include other fields if they exist
    if (current?.dietWishes) dto.dietWishes = current.dietWishes;
    if (current?.allergies) dto.allergies = current.allergies;
    if (current?.preferredMeals?.length)
      dto.preferredMeals = current.preferredMeals;

    this.loading.set(true);
    this.error.set(null);

    try {
      let result;
      if (current) {
        try {
          result = await this.api.updateNutritionSettings(dto);
        } catch (updateErr: any) {
          // If 404, settings don't exist yet, create them
          if (updateErr.status === 404) {
            result = await this.api.createNutritionSettings(dto);
          } else {
            throw updateErr;
          }
        }
      } else {
        // Create if doesn't exist
        result = await this.api.createNutritionSettings(dto);
      }
      if (result) {
        this.nutritionSettings.set(result);
      }
    } catch (err: any) {
      this.error.set(err.message || 'Fehler beim Speichern');
      console.error('Error updating person count:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updatePreferredMeals(meals: PreferredMeal[]) {
    const current = this.nutritionSettings();

    // Build clean DTO - only include the fields the backend expects
    const dto: UpdateNutritionSettingsDto = {
      preferredMeals: meals,
    };

    // Include other fields if they exist
    if (current?.personCount) dto.personCount = current.personCount;
    if (current?.dietWishes) dto.dietWishes = current.dietWishes;
    if (current?.allergies) dto.allergies = current.allergies;

    this.loading.set(true);
    this.error.set(null);

    try {
      let result;
      if (current) {
        try {
          result = await this.api.updateNutritionSettings(dto);
        } catch (updateErr: any) {
          // If 404, settings don't exist yet, create them
          if (updateErr.status === 404) {
            result = await this.api.createNutritionSettings(dto);
          } else {
            throw updateErr;
          }
        }
      } else {
        // Create if doesn't exist
        result = await this.api.createNutritionSettings(dto);
      }
      if (result) {
        this.nutritionSettings.set(result);
      }
    } catch (err: any) {
      this.error.set(err.message || 'Fehler beim Speichern');
      console.error('Error updating preferred meals:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updateDietWishes(dietWishes: string) {
    const current = this.nutritionSettings();

    // Check if all nutrition fields would be empty
    const wouldBeEmpty =
      !dietWishes &&
      (!current?.allergies || current.allergies === '') &&
      (!current?.preferredMeals || current.preferredMeals.length === 0);

    this.loading.set(true);
    this.error.set(null);

    try {
      if (wouldBeEmpty && current) {
        // All fields empty - delete the entire settings
        await this.api.deleteNutritionSettings();
        this.nutritionSettings.set(null);
      } else {
        // Build DTO - include dietWishes even if empty to allow deletion
        const dto: UpdateNutritionSettingsDto = {
          dietWishes: dietWishes || '', // Send empty string to clear the field
        };

        if (current?.personCount) dto.personCount = current.personCount;
        if (current?.preferredMeals?.length)
          dto.preferredMeals = current.preferredMeals;
        if (current?.allergies) dto.allergies = current.allergies;

        let result;
        if (current) {
          try {
            result = await this.api.updateNutritionSettings(dto);
          } catch (updateErr: any) {
            // If 404, settings don't exist yet, create them
            if (updateErr.status === 404) {
              result = await this.api.createNutritionSettings(dto);
            } else {
              throw updateErr;
            }
          }
        } else {
          // Create if doesn't exist
          result = await this.api.createNutritionSettings(dto);
        }
        if (result) {
          this.nutritionSettings.set(result);
        }
      }
    } catch (err: any) {
      this.error.set(err.message || 'Fehler beim Speichern');
      console.error('Error updating diet wishes:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updateAllergies(allergies: string) {
    const current = this.nutritionSettings();

    // Check if all nutrition fields would be empty
    const wouldBeEmpty =
      !allergies &&
      (!current?.dietWishes || current.dietWishes === '') &&
      (!current?.preferredMeals || current.preferredMeals.length === 0);

    this.loading.set(true);
    this.error.set(null);

    try {
      if (wouldBeEmpty && current) {
        // All fields empty - delete the entire settings
        await this.api.deleteNutritionSettings();
        this.nutritionSettings.set(null);
      } else {
        // Build DTO - include allergies even if empty to allow deletion
        const dto: UpdateNutritionSettingsDto = {
          allergies: allergies || '', // Send empty string to clear the field
        };

        if (current?.personCount) dto.personCount = current.personCount;
        if (current?.preferredMeals?.length)
          dto.preferredMeals = current.preferredMeals;
        if (current?.dietWishes) dto.dietWishes = current.dietWishes;

        let result;
        if (current) {
          try {
            result = await this.api.updateNutritionSettings(dto);
          } catch (updateErr: any) {
            // If 404, settings don't exist yet, create them
            if (updateErr.status === 404) {
              result = await this.api.createNutritionSettings(dto);
            } else {
              throw updateErr;
            }
          }
        } else {
          // Create if doesn't exist
          result = await this.api.createNutritionSettings(dto);
        }
        if (result) {
          this.nutritionSettings.set(result);
        }
      }
    } catch (err: any) {
      this.error.set(err.message || 'Fehler beim Speichern');
      console.error('Error updating allergies:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updateFavoriteIngredients(ingredients: string[]) {
    const current = this.planPersonalization();

    // Check if all personalization fields would be empty
    const wouldBeEmpty =
      (!ingredients || ingredients.length === 0) &&
      (!current?.excludedIngredients ||
        current.excludedIngredients.length === 0) &&
      (!current?.kitchenEquipment || current.kitchenEquipment.length === 0);

    this.loading.set(true);
    this.error.set(null);

    try {
      if (wouldBeEmpty && current) {
        // All fields empty - delete the entire settings
        await this.api.deletePlanPersonalization();
        this.planPersonalization.set(null);
      } else {
        // Build DTO - omit empty fields instead of sending empty arrays
        const dto: UpdatePlanPersonalizationDto = {};
        if (ingredients?.length) dto.favoriteIngredients = ingredients;
        if (current?.excludedIngredients?.length)
          dto.excludedIngredients = current.excludedIngredients;
        if (current?.kitchenEquipment)
          dto.kitchenEquipment = current.kitchenEquipment;

        let result;
        if (current) {
          try {
            result = await this.api.updatePlanPersonalization(dto);
          } catch (updateErr: any) {
            // If 404, settings don't exist yet, create them
            if (updateErr.status === 404) {
              result = await this.api.createPlanPersonalization(dto);
            } else {
              throw updateErr;
            }
          }
        } else {
          // Create if doesn't exist
          result = await this.api.createPlanPersonalization(dto);
        }
        if (result) {
          this.planPersonalization.set(result);
        }
      }
    } catch (err: any) {
      this.error.set(err.message || 'Fehler beim Speichern');
      console.error('Error updating favorite ingredients:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updateExcludedIngredients(ingredients: string[]) {
    const current = this.planPersonalization();

    // Check if all personalization fields would be empty
    const wouldBeEmpty =
      (!ingredients || ingredients.length === 0) &&
      (!current?.favoriteIngredients ||
        current.favoriteIngredients.length === 0) &&
      (!current?.kitchenEquipment || current.kitchenEquipment.length === 0);

    this.loading.set(true);
    this.error.set(null);

    try {
      if (wouldBeEmpty && current) {
        // All fields empty - delete the entire settings
        await this.api.deletePlanPersonalization();
        this.planPersonalization.set(null);
      } else {
        // Build DTO - omit empty fields instead of sending empty arrays
        const dto: UpdatePlanPersonalizationDto = {};
        if (ingredients?.length) dto.excludedIngredients = ingredients;
        if (current?.favoriteIngredients?.length)
          dto.favoriteIngredients = current.favoriteIngredients;
        if (current?.kitchenEquipment)
          dto.kitchenEquipment = current.kitchenEquipment;

        let result;
        if (current) {
          try {
            result = await this.api.updatePlanPersonalization(dto);
          } catch (updateErr: any) {
            // If 404, settings don't exist yet, create them
            if (updateErr.status === 404) {
              result = await this.api.createPlanPersonalization(dto);
            } else {
              throw updateErr;
            }
          }
        } else {
          // Create if doesn't exist
          result = await this.api.createPlanPersonalization(dto);
        }
        if (result) {
          this.planPersonalization.set(result);
        }
      }
    } catch (err: any) {
      this.error.set(err.message || 'Fehler beim Speichern');
      console.error('Error updating excluded ingredients:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async updateKitchenEquipment(equipment: KitchenEquipment[]) {
    const current = this.planPersonalization();

    // Check if all personalization fields would be empty
    const wouldBeEmpty =
      (!equipment || equipment.length === 0) &&
      (!current?.favoriteIngredients ||
        current.favoriteIngredients.length === 0) &&
      (!current?.excludedIngredients ||
        current.excludedIngredients.length === 0);

    this.loading.set(true);
    this.error.set(null);

    try {
      if (wouldBeEmpty && current) {
        // All fields empty - delete the entire settings
        await this.api.deletePlanPersonalization();
        this.planPersonalization.set(null);
      } else {
        // Build DTO - omit empty fields instead of sending empty arrays
        const dto: UpdatePlanPersonalizationDto = {};
        if (equipment?.length) dto.kitchenEquipment = equipment;
        if (current?.favoriteIngredients?.length)
          dto.favoriteIngredients = current.favoriteIngredients;
        if (current?.excludedIngredients?.length)
          dto.excludedIngredients = current.excludedIngredients;

        let result;
        if (current) {
          try {
            result = await this.api.updatePlanPersonalization(dto);
          } catch (updateErr: any) {
            // If 404, settings don't exist yet, create them
            if (updateErr.status === 404) {
              result = await this.api.createPlanPersonalization(dto);
            } else {
              throw updateErr;
            }
          }
        } else {
          // Create if doesn't exist
          result = await this.api.createPlanPersonalization(dto);
        }
        if (result) {
          this.planPersonalization.set(result);
        }
      }
    } catch (err: any) {
      this.error.set(err.message || 'Fehler beim Speichern');
      console.error('Error updating kitchen equipment:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  // Delete methods
  async deleteNutritionSettings() {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.api.deleteNutritionSettings();
      this.nutritionSettings.set(null);
    } catch (err: any) {
      this.error.set(err.message || 'Fehler beim Löschen');
      console.error('Error deleting nutrition settings:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async deletePlanPersonalization() {
    this.loading.set(true);
    this.error.set(null);

    try {
      await this.api.deletePlanPersonalization();
      this.planPersonalization.set(null);
    } catch (err: any) {
      this.error.set(err.message || 'Fehler beim Löschen');
      console.error('Error deleting plan personalization:', err);
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  // Helper methods
  private formatPreferredMeals(meals: PreferredMeal[]): string {
    const mealLabels: Record<PreferredMeal, string> = {
      [PreferredMeal.BREAKFAST]: 'Frühstück',
      [PreferredMeal.LUNCH]: 'Mittagessen',
      [PreferredMeal.DINNER]: 'Abendessen',
      [PreferredMeal.SNACKS]: 'Snacks',
    };

    return meals.map((meal) => mealLabels[meal]).join(', ');
  }

  private formatKitchenEquipment(equipment: KitchenEquipment[]): string {
    const equipmentLabels: Record<KitchenEquipment, string> = {
      [KitchenEquipment.AIRFRYER]: 'Heißluftfritteuse',
      [KitchenEquipment.MICROWAVE]: 'Mikrowelle',
      [KitchenEquipment.BLENDER]: 'Standmixer',
      [KitchenEquipment.FOOD_PROCESSOR]: 'Küchenmaschine',
      [KitchenEquipment.PRESSURE_COOKER]: 'Schnellkochtopf',
      [KitchenEquipment.SLOW_COOKER]: 'Slow Cooker',
    };

    return equipment.map((item) => equipmentLabels[item]).join(', ');
  }
}
