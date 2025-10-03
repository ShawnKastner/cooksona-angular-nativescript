import { Component, computed, inject, NO_ERRORS_SCHEMA } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { HealthStore } from '../health.store';
import { Droplet } from '@cooksona/constants/icons';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';

@Component({
  selector: 'ns-water-progress',
  templateUrl: './water-progress.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class WaterProgressComponent {
  private readonly store = inject(HealthStore);

  protected readonly Math = Math;
  protected readonly waterStep = 250;
  protected readonly waterGoal = 2500;
  protected readonly metrics = this.store.metricsForSelectedDate;

  icons = {
    Droplet,
  } as const;

  protected async adjustWater(delta: number): Promise<void> {
    const currentIntake = this.metrics().waterIntake;
    if (delta < 0 && currentIntake <= 0) return;
    await this.store.updateWater(delta);
  }

  protected waterProgress = computed(() =>
    Math.min((this.metrics().waterIntake / this.waterGoal) * 100, 100),
  );

  // SVG für die Wasserflasche (einfacher, moderner Stil)
  protected get bottleSvg(): string {
    const progress = this.waterProgress();

    // Flasche: Deckel (10-25), Körper (25-180)
    const bottleBodyTop = 25;
    const bottleBodyBottom = 180;
    const bottleBodyHeight = bottleBodyBottom - bottleBodyTop;

    // Berechne Füllhöhe von unten nach oben
    const fillHeight = (progress / 100) * bottleBodyHeight;
    const fillY = bottleBodyBottom - fillHeight;

    return `
            <svg width="100" height="200" viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
                <!-- Flaschendeckel (Schraubverschluss mit Rillen) -->
                <rect x="35" y="10" width="30" height="8" rx="2" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1"/>
                <line x1="37" y1="13" x2="37" y2="15" stroke="#CBD5E1" stroke-width="1"/>
                <line x1="42" y1="13" x2="42" y2="15" stroke="#CBD5E1" stroke-width="1"/>
                <line x1="47" y1="13" x2="47" y2="15" stroke="#CBD5E1" stroke-width="1"/>
                <line x1="52" y1="13" x2="52" y2="15" stroke="#CBD5E1" stroke-width="1"/>
                <line x1="57" y1="13" x2="57" y2="15" stroke="#CBD5E1" stroke-width="1"/>
                <line x1="62" y1="13" x2="62" y2="15" stroke="#CBD5E1" stroke-width="1"/>
                
                <!-- Flaschenhals -->
                <rect x="38" y="18" width="24" height="7" rx="1" fill="#F1F5F9" stroke="#CBD5E1" stroke-width="1.5"/>
                
                <!-- Flaschenkörper (gerundete Ecken unten) -->
                <rect x="30" y="25" width="40" height="155" rx="8" fill="#F8FAFC" stroke="#CBD5E1" stroke-width="2"/>
                
                <!-- Wasser-Füllung (innerhalb der Flasche) -->
                <clipPath id="bottleClip">
                    <rect x="32" y="27" width="36" height="151" rx="7"/>
                </clipPath>
                
                <rect x="32" y="${fillY}" width="36" height="${fillHeight + 2}" 
                      fill="#60A5FA" clip-path="url(#bottleClip)" rx="7"/>
                
                <!-- Markierungslinien (25%, 50%, 75%) -->
                <line x1="32" y1="63.75" x2="40" y2="63.75" stroke="#CBD5E1" stroke-width="1.5"/>
                <line x1="32" y1="102.5" x2="40" y2="102.5" stroke="#CBD5E1" stroke-width="1.5"/>
                <line x1="32" y1="141.25" x2="40" y2="141.25" stroke="#CBD5E1" stroke-width="1.5"/>
                
                <!-- Prozent-Anzeige im Wasser -->
                ${
                  progress > 15
                    ? `
                <text x="50" y="${bottleBodyBottom - 15}" 
                      text-anchor="middle" 
                      font-size="18" 
                      font-weight="bold" 
                      fill="white">${Math.round(progress)}%</text>
                `
                    : ''
                }
            </svg>
        `;
  }
}
