# In-App Purchase Integration für Cooksona

## Übersicht

Das Subscription-System ist vorbereitet und verwendet einen Service-Wrapper (`InAppPurchaseService`), der für die spätere Integration mit echten In-App-Käufen bereit ist.

## Aktuelle Implementation

### ✅ Was bereits funktioniert:

1. **Subscription Modal** - Schönes UI für Plan-Auswahl
2. **Zwei Pläne verfügbar:**
   - Monatlich: 4,99 €/Monat
   - Jährlich: 59,99 € (mit "Spare 10%" Badge)
3. **Features-Liste** zeigt alle Pro-Features
4. **Mock Purchase Flow** - Simuliert Kaufprozess
5. **Platform-Erkennung** - Zeigt "Apple Pay" auf iOS, "Google Pay" auf Android

### 📋 Nächste Schritte für echte In-App-Käufe:

## 1. NativeScript Purchase Plugin installieren

```bash
npm install @nativescript/purchase
```

## 2. iOS Setup (App Store Connect)

1. **App Store Connect konfigurieren:**
   - Gehe zu [App Store Connect](https://appstoreconnect.apple.com)
   - Wähle deine App
   - Gehe zu "Features" → "In-App Purchases"

2. **Subscription Groups erstellen:**
   - Erstelle eine neue Subscription Group: "Cooksona Pro"

3. **Subscriptions erstellen:**
   - **Monatlich:**
     - Product ID: `cooksona_pro_monthly`
     - Preis: 4,99 €
     - Laufzeit: 1 Monat
   - **Jährlich:**
     - Product ID: `cooksona_pro_yearly`
     - Preis: 59,99 €
     - Laufzeit: 12 Monate

4. **StoreKit Configuration (für Tests):**
   - Erstelle eine `.storekit` Datei in Xcode
   - Füge beide Subscriptions hinzu

## 3. Android Setup (Google Play Console)

1. **Play Console konfigurieren:**
   - Gehe zu [Google Play Console](https://play.google.com/console)
   - Wähle deine App
   - Gehe zu "Monetization" → "Subscriptions"

2. **Subscriptions erstellen:**
   - **Monatlich:**
     - Product ID: `cooksona_pro_monthly`
     - Preis: 4,99 €
     - Billing period: 1 Monat
   - **Jährlich:**
     - Product ID: `cooksona_pro_yearly`
     - Preis: 59,99 €
     - Billing period: 1 Jahr

3. **Test-Accounts hinzufügen:**
   - Füge Test-Email-Adressen für Testing hinzu

## 4. Code-Integration

### Update `InAppPurchaseService`:

```typescript
import { Purchase } from '@nativescript/purchase';

async initialize(): Promise<void> {
  if (this.initialized) return;

  try {
    await Purchase.init(['cooksona_pro_monthly', 'cooksona_pro_yearly']);
    this.initialized = true;
  } catch (error) {
    console.error('[IAP] Failed to initialize:', error);
    throw error;
  }
}

async getProducts(): Promise<Product[]> {
  const products = await Purchase.getProducts();
  return products.map(p => ({
    id: p.productIdentifier as ProductId,
    title: p.localizedTitle,
    description: p.localizedDescription,
    price: p.localizedPrice,
    priceAmount: p.price,
    currency: p.currencyCode,
  }));
}

async purchase(productId: ProductId): Promise<PurchaseResult> {
  try {
    const result = await Purchase.buy(productId);

    // Verify purchase on your backend
    await this.verifyPurchaseOnBackend(result);

    return {
      success: true,
      productId,
      transactionId: result.transactionIdentifier,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async restorePurchases(): Promise<PurchaseResult[]> {
  const purchases = await Purchase.restorePurchases();

  // Verify each restored purchase on backend
  const results = [];
  for (const purchase of purchases) {
    await this.verifyPurchaseOnBackend(purchase);
    results.push({
      success: true,
      productId: purchase.productIdentifier as ProductId,
      transactionId: purchase.transactionIdentifier,
    });
  }

  return results;
}
```

## 5. Backend-Integration

Du benötigst Backend-Endpunkte für:

1. **Purchase Verification:**

   ```
   POST /api/subscriptions/verify
   Body: { transactionId, receipt, platform }
   ```

2. **Subscription Status:**

   ```
   GET /api/subscriptions/status
   Response: { active: boolean, plan: 'monthly' | 'yearly', expiresAt: Date }
   ```

3. **Webhook für Server-to-Server Notifications:**
   - iOS: App Store Server Notifications
   - Android: Real-time Developer Notifications

## 6. Testing

### iOS Testing:

- Verwende Sandbox-Test-Accounts aus App Store Connect
- Teste mit StoreKit Configuration in Xcode
- Teste Restore Purchases

### Android Testing:

- Verwende Test-Tracks (Internal/Closed Testing)
- Teste mit Lizenz-Testern
- Teste Restore Purchases

## 7. App Store Review Guidelines

Stelle sicher:

- ✅ Restore Purchases Button ist implementiert (Pflicht für iOS)
- ✅ Subscription Details sind klar (Preis, Laufzeit, Auto-Renewal)
- ✅ Terms & Conditions und Privacy Policy sind verlinkt
- ✅ Subscription kann in den iOS/Android Einstellungen gekündigt werden

## Dateien die angepasst werden müssen:

1. `/apps/mobile/src/plugins/in-app-purchase/in-app-purchase.service.ts`
2. Backend-API Endpunkte erstellen
3. User-Model erweitern um Subscription-Status

## Hilfreiche Links:

- [NativeScript Purchase Plugin](https://github.com/NativeScript/purchases)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
- [StoreKit Testing](https://developer.apple.com/documentation/storekit/testing_in-app_purchases_in_xcode)
