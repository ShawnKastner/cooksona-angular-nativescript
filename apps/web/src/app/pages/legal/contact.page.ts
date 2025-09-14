// apps/web/src/app/pages/legal/contact.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-3xl font-serif font-bold mb-4">Kontakt</h2>
      <p class="text-gray-600">Kontaktformular oder Informationen folgen.</p>
    </div>
  `,
})
export class ContactPage {}

