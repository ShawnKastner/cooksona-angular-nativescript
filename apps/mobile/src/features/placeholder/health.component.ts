import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';

@Component({
  selector: 'ns-health',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <GridLayout rows="*" class="items-center justify-center">
      <Label text="Health" class="text-xl"></Label>
    </GridLayout>
  `,
})
export class HealthComponent {}
