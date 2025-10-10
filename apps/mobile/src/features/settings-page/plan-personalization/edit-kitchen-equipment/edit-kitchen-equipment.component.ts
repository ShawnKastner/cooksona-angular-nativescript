import {
  Component,
  NO_ERRORS_SCHEMA,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { ProfileSettingsStore, KitchenEquipment } from '@cooksona/models';

interface KitchenEquipmentOption {
  id: KitchenEquipment;
  label: string;
  selected: boolean;
}

@Component({
  selector: 'ns-edit-kitchen-equipment',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-kitchen-equipment.component.html',
  styles: [
    `
      Switch {
        background-color: #4a6c6f;
        off-background-color: #9ca3af;
      }
    `,
  ],
})
export class EditKitchenEquipmentComponent implements OnInit {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly store = inject(ProfileSettingsStore);

  protected readonly equipmentOptions = signal<KitchenEquipmentOption[]>([
    {
      id: KitchenEquipment.AIRFRYER,
      label: 'Heißluftfritteuse',
      selected: false,
    },
    { id: KitchenEquipment.MICROWAVE, label: 'Mikrowelle', selected: false },
    { id: KitchenEquipment.BLENDER, label: 'Standmixer', selected: false },
    {
      id: KitchenEquipment.FOOD_PROCESSOR,
      label: 'Küchenmaschine',
      selected: false,
    },
    {
      id: KitchenEquipment.PRESSURE_COOKER,
      label: 'Schnellkochtopf',
      selected: false,
    },
    { id: KitchenEquipment.SLOW_COOKER, label: 'Slow Cooker', selected: false },
  ]);

  ngOnInit() {
    const currentValue = this.store.kitchenEquipment$();

    if (currentValue && currentValue.length > 0) {
      this.equipmentOptions.update((options) =>
        options.map((opt) => ({
          ...opt,
          selected: currentValue.includes(opt.id),
        })),
      );
    }
  }

  protected toggleEquipment(id: KitchenEquipment) {
    this.equipmentOptions.update((options) =>
      options.map((opt) =>
        opt.id === id ? { ...opt, selected: !opt.selected } : opt,
      ),
    );
  }

  protected async save() {
    try {
      const selected = this.equipmentOptions()
        .filter((opt) => opt.selected)
        .map((opt) => opt.id);

      await this.store.updateKitchenEquipment(selected);
      this.routerExtensions.back();
    } catch (error) {
      console.error('Failed to save kitchen equipment:', error);
    }
  }

  protected cancel() {
    this.routerExtensions.back();
  }
}
