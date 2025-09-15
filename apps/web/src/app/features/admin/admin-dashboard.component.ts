// apps/web/src/app/features/admin/admin-dashboard.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mx-auto p-6">
      <h2 class="text-3xl font-serif font-bold mb-4">Admin Dashboard</h2>
      <p class="text-gray-600">Admin-Bereich folgt.</p>
    </div>
  `,
})
export class AdminDashboard {}
