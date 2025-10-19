# 📱 Push-Benachrichtigungen – aktueller Stand

## ✅ Trink-Erinnerungen

Die Trink-Erinnerung wurde auf einen schlanken Workflow reduziert:

- **Ein Toggle** in den Einstellungen aktiviert/deaktiviert die Funktion.
- **Best-Practice-Zeitplan** (ca. 09:00, 11:30, 14:30, 17:30 Uhr lokale Zeit).
- **Lokale Planung für mehrere Tage im Voraus** – funktioniert auch offline.
- **System-Respekt**: „Nicht stören“/Ruhezeiten werden vom Betriebssystem berücksichtigt.
- **Automatisches Pausieren** sobald das Tagesziel erreicht ist.
- **Tippen auf die Notification** führt direkt zum Gesundheitsbereich mit Fokus auf Wasser.
- **Status-Sync**: Einstellung wird im Nutzerkonto hinterlegt und lokal gespiegelt.

## 🔧 Technischer Überblick

### Kern-Services

- `apps/mobile/src/core/services/notification.service.ts`
  - Verwaltung der lokalen Benachrichtigungstermine.
  - Synchronisation mehrerer Erinnerungen pro Tag.
  - Verwaltung des „Tagesziel erreicht“-Status.
  - Öffnet bei Tap den Wasser-Log.
- `apps/mobile/src/core/services/notification-preferences.service.ts`
  - Liest/schreibt den Nutzerstatus (Toggle) per API und spiegelt ihn lokal.
- `apps/mobile/src/core/services/water-reminder-coordinator.service.ts`
  - Beobachtet die Tagesmetriken und pausiert/restauriert Erinnerungen automatisch.

### UI-Komponente

- `notifications-settings/notifications-settings.component.ts/.html`
  - Single-Toggle UI inkl. Permission-Hinweisen.
  - Zeigt geplante Zeiten lokalisiert an.
  - Bietet Direktlink zu den System-Mitteilungseinstellungen.

## 🧠 Ablauf

1. Nutzer aktiviert den Toggle → Berechtigungen werden geprüft/angefragt.
2. Erinnerungen für die nächsten Tage werden lokal eingeplant.
3. Änderungen am Wasserverbrauch triggern den Koordinator:
   - Tagesziel erreicht → verbleibende Erinnerungen des Tages werden storniert.
   - Neuer Tag → Plan wird automatisch aufgefüllt.
4. App-Resume synchronisiert den Plan (z. B. nach Änderungen am Systemstatus).

## 🛠️ Debugging & Tests

- `NotificationService` loggt Fehler (Scheduling/Cancel).
- Zum schnellen Testen eine Erinnerung wenige Minuten in die Zukunft legen (Systemzeit anpassen).
- Auf Geräten mit Android 13+ muss die System-Berechtigung „Mitteilungen“ einmalig erlaubt werden.

## 🚀 Erweiterungsideen

- Weitere Reminder-Typen (z. B. Mahlzeiten) können über zusätzliche Zeitpläne ergänzt werden.
- Anpassung der Best-Practice-Zeitpunkte je nach Nutzerprofil.
