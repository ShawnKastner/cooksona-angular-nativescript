import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-accessibility-statement',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './accessibility-statement.component.html',
})
export class AccessibilityStatementComponent {
  readonly email = 'barrierefreiheit@cooksona.de';
  readonly lastUpdated = '24. Oktober 2025';
}
