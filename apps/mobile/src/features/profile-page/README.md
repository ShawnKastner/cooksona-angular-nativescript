# Profile Page

Diese Seite ermöglicht es Benutzern, ihr Profil und ihre Einstellungen zu verwalten.

## Funktionen

### Benutzerinformationen

- Anzeige des Benutzernamens
- Anzeige der E-Mail-Adresse
- Benutzer-Avatar (standardmäßig User-Icon)

### Abo-Verwaltung

- Anzeige des aktuellen Abo-Status (Kostenlos, Monatlich, Jährlich, Lifetime)
- Navigation zur Abo-Verwaltung (TODO: noch zu implementieren)

### Health Integration

- **iOS**: Verbindung mit Apple Health
- **Android**: Verbindung mit Google Fit
- Anzeige des Verbindungsstatus
- Ein-/Ausschalten der Health-Integration

### Abmelden

- Logout-Button zum Abmelden aus der App

## TODO

1. **Abo-Verwaltung implementieren**
   - Subscriptions-Page oder Modal erstellen
   - PayPal/Stripe Integration für Abo-Änderungen

2. **Health Service implementieren**
   - Apple Health Plugin konfigurieren und implementieren
   - Google Fit Plugin konfigurieren und implementieren
   - Health-Daten synchronisieren

3. **Weitere Einstellungen**
   - Benachrichtigungseinstellungen
   - Datenschutz & Sicherheit
   - App-Sprache
   - Konto löschen

## Verwendung

Die Profile-Page ist über die Tab-Navigation erreichbar und wird automatisch über die Route `/home/profile` geladen.

```typescript
// Route in app.routes.ts
{
  path: 'profile',
  loadComponent: () =>
    import('./features/profile-page/profile-page.component').then(
      (m) => m.ProfilePageComponent,
    ),
}
```

## Design

Die Seite folgt dem bestehenden Design-System:

- Primärfarbe: `#4A6C6F` (primary)
- Hintergrund: `#F5F5F5` (base-100)
- Karten: Weiß mit abgerundeten Ecken (`rounded-2xl`)
- Icons: SVG mit dynamischen Farben
- Spacing: Konsistente Abstände mit Tailwind-Klassen
