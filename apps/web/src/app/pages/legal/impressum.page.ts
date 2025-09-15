// apps/web/src/app/pages/legal/impressum.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-impressum-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-3xl font-serif font-bold mb-4">Impressum</h2>
      <p class="text-gray-600">Rechtliche Inhalte werden hier eingepflegt.</p>
    </div>
  `,
})
export class ImpressumPage {}
