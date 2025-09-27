import { Component, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';

@Component({
  selector: 'ns-cookbook',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <GridLayout rows="*" class="items-center justify-center">
      <Label text="Kochbuch" class="text-xl"></Label>
    </GridLayout>
  `,
})
export class CookbookComponent {}
