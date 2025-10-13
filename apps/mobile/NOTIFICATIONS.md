# 📱 Push-Benachrichtigungen Implementation

## ✅ Vollständig implementiert und erweitert

Die App unterstützt jetzt erweiterte lokale Push-Benachrichtigungen mit dem `@nativescript/local-notifications` Package.

## 🎯 Features

### Trink-Erinnerung (Erweitert)

#### Grundfunktionen

- **Flexible Erinnerungszeiten**: Mehrere feste Zeiten oder intervallbasierte Erinnerungen
- **Pause/Resume**: Erinnerungen temporär pausieren ohne Konfiguration zu löschen
- **Ein-/Ausschalten**: Einfach per Toggle aktivieren/deaktivieren
- **Persistenz**: Einstellungen bleiben nach App-Neustart erhalten
- **Cloud-Sync**: Geräteübergreifende Synchronisation über Backend-API
- **Offline-Funktionalität**: Lokale Planung funktioniert auch ohne Internetverbindung
- **Automatische Berechtigungsanfrage**: Wird beim ersten Aktivieren durchgeführt

#### Erweiterte Konfiguration

- **Feste Zeiten**: Mehrere individuelle Erinnerungszeiten pro Tag konfigurierbar
- **Intervalle**: Automatische Erinnerungen alle 1-4 Stunden innerhalb eines Zeitfensters
- **Wochentage**: Auswahl aktiver Wochentage (Mo-So)
- **Ruhezeiten**: Keine Erinnerungen während konfigurierbarer Ruhezeiten (z.B. 22:00-07:00)
- **Tagesziel**: Automatische Unterdrückung weiterer Erinnerungen bei Erreichen des Wasserziels
- **Fortschritts-Anzeige**: Benachrichtigungstext zeigt verbleibende ml bis zum Tagesziel

#### Intelligente Features

- **Dynamischer Content**: Benachrichtigungen passen sich dem aktuellen Fortschritt an
- **Ziel-basierte Unterdrückung**: Keine weiteren Erinnerungen wenn Tagesziel erreicht
- **Wochentags-Filter**: Erinnerungen nur an ausgewählten Wochentagen
- **Ruhezeiten-Respektierung**: Keine Störungen während definierter Ruhezeiten

## 🔧 Wie es funktioniert

### User Flow

1. **Einstellungen → Push-Benachrichtigungen** öffnen
2. **Trink-Erinnerung** konfigurieren:
   - Toggle aktivieren → Berechtigungen werden angefragt (falls nötig)
   - **Erinnerungsart** wählen:
     - **Feste Zeiten**: Mehrere spezifische Uhrzeiten hinzufügen/bearbeiten/löschen
     - **Intervalle**: Intervall (1-4h) und Zeitfenster wählen
   - **Erweiterte Einstellungen** (optional):
     - Aktive Wochentage auswählen
     - Ruhezeiten aktivieren
     - Tagesziel anpassen
   - **Pause-Toggle**: Erinnerungen temporär deaktivieren
3. **Speichern** → Einstellungen werden lokal und im Backend gespeichert
4. **Zurück navigieren** → Fertig!

### Technical Flow

1. **Aktivierung**:
   - Benachrichtigungsberechtigungen werden angefragt
   - Konfiguration wird validiert
   - Mehrere Notifications werden basierend auf Typ geplant
   - Einstellungen werden lokal (ApplicationSettings) und remote (API) gespeichert

2. **Scheduling Logic**:
   - Bei Fixed Times: Jede Zeit bekommt eigene Notification-ID
   - Bei Intervallen: Zeiten werden basierend auf Intervall und Zeitfenster berechnet
   - Filter werden angewendet: Wochentage, Ruhezeiten
   - Max. Anzahl pro Tag wird respektiert
   - Alle IDs werden für spätere Verwaltung gespeichert

3. **Runtime**:
   - HealthStore liefert aktuellen Wasserkonsum
   - Notification-Body wird dynamisch mit Fortschritt generiert
   - Bei Erreichen des Tagesziels: Weitere Erinnerungen werden unterdrückt

4. **Deaktivierung**:
   - Alle geplanten Notifications werden abgebrochen
   - Konfiguration bleibt erhalten für spätere Reaktivierung

## 📂 Dateien

### Core Service

- `apps/mobile/src/core/services/notification.service.ts`
  - Zentrale Verwaltung aller Benachrichtigungen
  - Automatische Berechtigungsanfrage mit Console-Logging
  - Methoden zum Planen, Abbrechen und Verwalten

### Komponenten

- `notifications-settings/notifications-settings.component.ts/.html`
  - Übersicht mit Toggle
  - Navigation zur Zeitauswahl
- `edit-water-reminder/edit-water-reminder.component.ts/.html`
  - Time-Picker für Stunden (00-23) und Minuten (00-59)
  - Auto-Save bei jeder Änderung
  - Keine Speichern-Buttons oder Bestätigungsdialoge

### Berechtigungen

- **Android**: `AndroidManifest.xml`
  - VIBRATE, RECEIVE_BOOT_COMPLETED, SCHEDULE_EXACT_ALARM, POST_NOTIFICATIONS
- **iOS**: `Info.plist`
  - NSUserNotificationsUsageDescription

## � Debugging

### Console Logs

Das Feature loggt alle wichtigen Schritte:

```
Requesting notification permissions...
Has permission: false
Requesting permission from user...
Permission granted: true
Scheduling water reminder for 9:0...
Scheduling notification for: [Date]
Water reminder scheduled: true
Water reminder auto-saved and scheduled: 09:00
```

### ListPicker Fix

Das Time-Picker Problem wurde behoben durch:

- Event: `selectedIndexChanged` (nicht `selectedIndexChange`)
- Event-Parameter: `args.newIndex` (nicht `args.object.selectedIndex`)
- Items als Properties gespeichert (nicht als Getter)

### Häufige Probleme

**Problem**: Zeit springt auf 00:00 zurück
**Lösung**: ✅ Fixed - Event-Handler verwenden jetzt `args.newIndex`

**Problem**: Berechtigungen werden nicht angefragt
**Lösung**: ✅ Fixed - Service fragt automatisch bei `scheduleWaterReminder()` an

**Problem**: Notification wird nicht angezeigt
**Lösung**: Überprüfen Sie:

1. Console-Logs für Fehler
2. Geräte-Einstellungen → Benachrichtigungen → Cooksona
3. Zeit ist in der Zukunft (testenSie mit 1-2 Minuten voraus)

## 📋 Notification Details

### Trink-Erinnerung

- **IDs**: 1001+ (Base ID 1001, weitere IDs für mehrere Erinnerungen)
- **Titel**: "💧 Zeit zu trinken!"
- **Body** (dynamisch):
  - Standard: "Vergiss nicht, ein Glas Wasser zu trinken."
  - Mit Fortschritt: "Noch XXX ml bis zum Tagesziel!"
  - Ziel erreicht: "Tagesziel erreicht! 🎉 Weiter so!"
- **Intervall**: Täglich zur gewählten Zeit(en)
- **Sound**: Default
- **Badge**: 1
- **Tap-Action**: Öffnet Health Hub (Wasser-Tracker)

## 🧪 Testing

### Schnelltest (1 Minute)

1. Gehe zu **Einstellungen → Push-Benachrichtigungen**
2. Aktiviere **Trink-Erinnerung** → Wirst zur Zeitauswahl navigiert
3. Berechtigungsdialog erscheint → **Erlauben** klicken
4. Stelle Zeit auf **1 Minute in der Zukunft**
5. Gehe zurück zur App oder Home-Screen
6. Warte 1 Minute → Benachrichtigung erscheint! 🎉

### Console überprüfen

```bash
# In Terminal während App läuft
ns run ios --no-hmr
# oder
ns run android --no-hmr
```

Achten Sie auf die Console-Logs für:

- Permission requests
- Scheduling confirmation
- Auto-save events

## 📊 Data Models

### WaterReminderConfig

```typescript
interface WaterReminderConfig {
  enabled: boolean;
  paused?: boolean;
  reminderType: 'fixed_times' | 'interval';

  // Feste Zeiten
  fixedTimes?: WaterReminderTime[];

  // Intervall-Modus
  intervalHours?: number; // 1-4
  intervalStartHour?: number; // z.B. 7
  intervalStartMinute?: number; // z.B. 0
  intervalEndHour?: number; // z.B. 22
  intervalEndMinute?: number; // z.B. 0

  // Gemeinsame Einstellungen
  activeWeekdays?: Weekday[];
  quietHours?: QuietHours;
  maxRemindersPerDay?: number;
  waterGoalMl?: number;
}
```

### Storage

- **Local**: `ApplicationSettings` mit Key `water_reminder_config_v2`
- **Remote**: Backend API `/profile/notification-settings`
- **Scheduled IDs**: `water_reminder_scheduled_ids` (für Verwaltung)

## 🚀 Erweiterungsmöglichkeiten

### Weitere Features (optional)

- **Snooze-Buttons**: +15 Min, +30 Min Aktionen in Notification
- **Smart-Timing**: ML-basierte Vorschläge für optimale Erinnerungszeiten
- **Wetter-Integration**: Mehr Erinnerungen an heißen Tagen
- **Aktivitäts-Integration**: Mehr Erinnerungen nach Sport

### Weitere Notification-Typen

Weitere Notification-Typen nach gleichem Muster:

```typescript
// notification.service.ts
private readonly MEAL_REMINDER_BASE_ID = 2001;

async scheduleMealReminders(config: MealReminderConfig) {
  // Ähnliche Logik wie scheduleWaterReminders
}
```

## ⚙️ Wichtige Hinweise

- **iOS**: Berechtigungen werden beim ersten `schedule()` angefragt
- **Android 13+**: POST_NOTIFICATIONS Permission wird beim ersten Mal angefragt
- **Auto-Save**: Kein manuelles Speichern nötig - alles automatisch
- **Keine Dialoge**: Sauberer UX-Flow ohne Alert/Confirm-Fenster
- **Console Logging**: Alle wichtigen Events werden geloggt für Debugging
