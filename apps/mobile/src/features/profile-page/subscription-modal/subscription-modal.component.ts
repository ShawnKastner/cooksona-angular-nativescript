import { Component, NO_ERRORS_SCHEMA, inject, signal } from '@angular/core';
import { NativeScriptCommonModule } from '@nativescript/angular';
import { ModalDialogParams } from '@nativescript/angular';
import { SvgToDataUriPipe } from '../../../utils/svg-to-data-uri.pipe';
import { X, Check, Star, Sparkles } from '@cooksona/constants/icons';
import {
  InAppPurchaseService,
  ProductId,
} from '../../../plugins/in-app-purchase/in-app-purchase.service';
import { alert } from '@nativescript/core/ui/dialogs';

export type SubscriptionPlan = 'monthly' | 'yearly';

interface PlanOption {
  id: SubscriptionPlan;
  name: string;
  price: string;
  pricePerMonth: string;
  savings?: string;
  popular?: boolean;
}

@Component({
  selector: 'ns-subscription-modal',
  templateUrl: './subscription-modal.component.html',
  standalone: true,
  imports: [NativeScriptCommonModule, SvgToDataUriPipe],
  schemas: [NO_ERRORS_SCHEMA],
})
export class SubscriptionModalComponent {
  private params = inject(ModalDialogParams);
  private purchaseService = inject(InAppPurchaseService);

  protected readonly icons = {
    X,
    Check,
    Star,
    Sparkles,
  } as const;

  protected loading = signal(false);
  protected selectedPlan = signal<SubscriptionPlan>('yearly');

  protected readonly purchaseMethodName =
    this.purchaseService.getPurchaseMethodName();

  protected readonly plans: PlanOption[] = [
    {
      id: 'monthly',
      name: 'Monatlich',
      price: '4,99 €',
      pricePerMonth: '4,99 €/Monat',
    },
    {
      id: 'yearly',
      name: 'Jährlich',
      price: '59,99 €',
      pricePerMonth: '5,00 €/Monat',
      savings: 'Spare 10%',
      popular: true,
    },
  ];

  protected readonly features = [
    'Unbegrenzte Rezepte',
    'Erweiterte Ernährungsanalyse',
    'Apple Health Integration',
    'Mahlzeiten-Tracking',
    'Aktivitäten-Tracking',
    'Individuelle Makro-Ziele',
    'Rezept-Sammlungen',
    'Prioritäts-Support',
  ];

  protected selectPlan(plan: SubscriptionPlan): void {
    this.selectedPlan.set(plan);
  }

  protected isPlanSelected(plan: SubscriptionPlan): boolean {
    return this.selectedPlan() === plan;
  }

  protected close(): void {
    this.params.closeCallback(null);
  }

  protected async subscribe(): Promise<void> {
    if (this.loading()) return;

    this.loading.set(true);

    try {
      const selectedPlan = this.selectedPlan();
      const productId: ProductId =
        selectedPlan === 'monthly'
          ? 'cooksona_pro_monthly'
          : 'cooksona_pro_yearly';

      // Attempt purchase
      const result = await this.purchaseService.purchase(productId);

      if (result.success) {
        // Successfully purchased
        this.params.closeCallback(selectedPlan);
      } else {
        // Purchase failed
        await alert({
          title: 'Kauf fehlgeschlagen',
          message:
            result.error ||
            'Der Kauf konnte nicht abgeschlossen werden. Bitte versuche es erneut.',
          okButtonText: 'OK',
        });
        this.loading.set(false);
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      await alert({
        title: 'Fehler',
        message:
          'Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.',
        okButtonText: 'OK',
      });
      this.loading.set(false);
    }
  }

  protected async restorePurchases(): Promise<void> {
    try {
      this.loading.set(true);

      const restoredPurchases = await this.purchaseService.restorePurchases();

      if (restoredPurchases.length > 0) {
        await alert({
          title: 'Käufe wiederhergestellt',
          message: 'Deine Käufe wurden erfolgreich wiederhergestellt.',
          okButtonText: 'OK',
        });
        this.params.closeCallback('restored');
      } else {
        await alert({
          title: 'Keine Käufe gefunden',
          message: 'Es wurden keine früheren Käufe gefunden.',
          okButtonText: 'OK',
        });
      }
    } catch (error) {
      console.error('Restore failed:', error);
      await alert({
        title: 'Fehler',
        message: 'Käufe konnten nicht wiederhergestellt werden.',
        okButtonText: 'OK',
      });
    } finally {
      this.loading.set(false);
    }
  }

  // Helper methods for template
  protected getFeatureRow(index: number): number {
    return Math.floor(index / 2);
  }

  protected getFeatureCol(index: number): number {
    return index % 2;
  }
}
