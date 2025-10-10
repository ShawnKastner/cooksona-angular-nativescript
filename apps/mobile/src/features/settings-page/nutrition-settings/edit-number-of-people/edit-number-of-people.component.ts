import { Component, NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'ns-edit-number-of-people',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-number-of-people.component.html',
})
export class EditNumberOfPeopleComponent {
  protected numberOfPeople = signal(2);

  constructor(
    private routerExtensions: RouterExtensions,
    private route: ActivatedRoute,
  ) {
    // TODO: Load actual value from service/store
  }

  protected increment() {
    if (this.numberOfPeople() < 10) {
      this.numberOfPeople.update((n) => n + 1);
    }
  }

  protected decrement() {
    if (this.numberOfPeople() > 1) {
      this.numberOfPeople.update((n) => n - 1);
    }
  }

  protected save() {
    // TODO: Save to service/store
    console.log('Saving number of people:', this.numberOfPeople());
    this.routerExtensions.back();
  }

  protected cancel() {
    this.routerExtensions.back();
  }
}
