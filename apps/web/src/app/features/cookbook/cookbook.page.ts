// apps/web/src/app/features/cookbook/cookbook.page.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cookbook-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-3xl font-serif font-bold mb-4">Mein Kochbuch</h2>
      <p class="text-gray-600">Inhalte des Kochbuchs folgen.</p>
    </div>
  `,
})
export class CookbookPage {}
