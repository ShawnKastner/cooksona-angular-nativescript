import {
  Component,
  NO_ERRORS_SCHEMA,
  signal,
  OnInit,
  inject,
} from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { RouterExtensions } from '@nativescript/angular';
import { ProfileSettingsStore } from '@cooksona/models';

@Component({
  selector: 'ns-edit-number-of-people',
  standalone: true,
  imports: [NativeScriptCommonModule],
  schemas: [NO_ERRORS_SCHEMA],
  templateUrl: './edit-number-of-people.component.html',
})
export class EditNumberOfPeopleComponent implements OnInit {
  private readonly routerExtensions = inject(RouterExtensions);
  private readonly store = inject(ProfileSettingsStore);

  protected numberOfPeople = signal<number>(2);

  ngOnInit() {
    // Load current value from store
    const currentCount = this.store.personCount$();
    if (currentCount && typeof currentCount === 'number') {
      this.numberOfPeople.set(currentCount);
    }
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
    this.store.updatePersonCount(this.numberOfPeople());
    this.routerExtensions.back();
  }

  protected cancel() {
    this.routerExtensions.back();
  }
}
