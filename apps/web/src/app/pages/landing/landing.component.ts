import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  FeatureCardComponent,
  FeatureCardProps,
} from './feature-card.component';
import {
  UtensilsCrossed,
  Sparkles,
  ShoppingBasket,
  ChefHat,
  BarChart2,
  Cookie,
} from '@cooksona/constants/icons';
import { SvgInjectDirective } from '../../shared/directives/svg-inject.directive';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FeatureCardComponent,
    SvgInjectDirective,
  ],
  templateUrl: './landing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  readonly features: FeatureCardProps[] = [
    {
      icon: ChefHat,
      title: 'Intelligente Essensplanung',
      desc: 'Erstelle individuelle, gesunde und abwechslungsreiche Essenspläne mit nur wenigen Klicks.',
    },
    {
      icon: ShoppingBasket,
      title: 'Automatische Einkaufsliste',
      desc: 'Alle Zutaten werden direkt in eine praktische Einkaufsliste übernommen.',
    },
    {
      icon: BarChart2,
      title: 'Nährwert-Analyse',
      desc: 'Behalte Kalorien, Makros und Allergene immer im Blick.',
    },
    {
      icon: Cookie,
      title: 'Kochbuch & Favoriten',
      desc: 'Speichere deine Lieblingsrezepte und verwalte dein persönliches Kochbuch.',
    },
  ];

  protected readonly icons = {
    UtensilsCrossed,
    Sparkles,
  } as const;
}
