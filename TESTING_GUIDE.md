# Accessibility Testing Guide - CookSona

## Übersicht

Dieser Leitfaden beschreibt die Durchführung von Barrierefreiheitstests für CookSona, um WCAG 2.1 AA Konformität sicherzustellen.

## Automatisierte Tests

### Setup

```bash
# Dependencies installieren
npm install

# Dev-Server starten
npm start
```

### Tests ausführen

#### 1. Umfassende axe-core Tests
```bash
# In neuem Terminal (während Dev-Server läuft)
npm run a11y:test
```

Dieser Test:
- Testet alle definierten Seiten
- Prüft WCAG 2.1 A und AA Konformität
- Erstellt HTML-Report mit Screenshots
- Erstellt JSON-Report für CI/CD
- Exit Code 1 bei Violations

**Output:**
- `a11y-reports/accessibility-report.html` - Visueller Report
- `a11y-reports/accessibility-report.json` - Maschinenlesbares Format
- `a11y-reports/screenshots/*.png` - Screenshots aller Seiten

#### 2. pa11y CI Tests
```bash
npm run a11y:test:ci
```

Konfiguration in `.pa11yci.json`:
```json
{
  "defaults": {
    "standard": "WCAG2AA",
    "runners": ["axe"],
    "timeout": 30000
  },
  "urls": [...]
}
```

#### 3. Axe CLI Audit
```bash
npm run a11y:audit
```

Schneller Check einer einzelnen URL.

### CI/CD Integration

#### GitHub Actions

```yaml
name: Accessibility Tests

on: [push, pull_request]

jobs:
  a11y:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build app
        run: npm run build
      
      - name: Start app
        run: npm start &
      
      - name: Wait for app
        run: sleep 10
      
      - name: Run accessibility tests
        run: npm run a11y:test
      
      - name: Upload reports
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: a11y-reports
          path: a11y-reports/
```

## Manuelle Tests

### 1. Tastatur-Navigation (Web)

#### Test-Schritte

**A. Grundlegende Navigation**
1. Öffne Seite im Browser
2. Drücke `Tab` zum nächsten Element
3. Prüfe: Ist der Fokus sichtbar? (3px outline)
4. Navigiere durch alle interaktiven Elemente
5. Prüfe: Ist die Reihenfolge logisch?

**B. Skip-Link**
1. Lade beliebige Seite
2. Drücke `Tab` (erstes Element sollte Skip-Link sein)
3. Skip-Link sollte sichtbar werden
4. Drücke `Enter`
5. Fokus springt zu `#main-content`

**C. Navigation-Menu**
1. Tab zu User-Menu Button
2. Drücke `Enter` oder `Space` - Menu öffnet sich
3. Tab durch Menu-Items
4. Prüfe: Fokus bleibt im Menu
5. Drücke `ESC` - Menu schließt
6. Fokus kehrt zu Button zurück

**D. Formulare**
1. Tab zu Formular (z.B. Login)
2. Tab durch alle Felder
3. Fülle Feld falsch aus
4. Submit
5. Prüfe: Fokus geht zu Fehler
6. Prüfe: Fehlermeldung ist sichtbar
7. Prüfe: Feld hat `aria-invalid="true"`

**E. Modale**
1. Öffne Modal
2. Prüfe: Fokus ist im Modal
3. Tab durch Modal-Elemente
4. Prüfe: Tab verlässt Modal nicht (Fokusfalle)
5. Drücke `ESC` - Modal schließt
6. Fokus kehrt zu Trigger-Element zurück

#### Erwartete Ergebnisse
✅ Alle interaktiven Elemente per Tab erreichbar  
✅ Fokus ist immer sichtbar (3px outline)  
✅ Logische Tab-Reihenfolge  
✅ ESC schließt Modals/Dropdowns  
✅ Fokus kehrt zu Trigger zurück  
✅ Keine Fokusfallen außer in Modals

### 2. Screen Reader Tests

#### NVDA (Windows)

**Installation:**
```
https://www.nvaccess.org/download/
```

**Wichtige Shortcuts:**
- `Insert + Down Arrow` - Browse Mode ein/aus
- `H` - Nächste Überschrift
- `1-6` - Überschrift Level 1-6
- `L` - Nächste Liste
- `F` - Nächstes Formularfeld
- `B` - Nächster Button
- `K` - Nächster Link

**Test-Durchlauf:**
1. Starte NVDA (`Control + Alt + N`)
2. Öffne CookSona im Browser
3. Prüfe: Page Title wird angesagt
4. Drücke `H` - Springe durch Überschriften
   - ✅ H1: "CookSona" oder Seitentitel
   - ✅ Hierarchie ist logisch (H1 → H2 → H3)
5. Drücke `K` - Springe durch Links
   - ✅ Links haben beschreibenden Text
   - ✅ "Hier klicken" wird vermieden
6. Navigate zum Login-Formular
   - ✅ Labels werden vorgelesen
   - ✅ Fehlermeldungen werden angesagt
   - ✅ Hilfetext wird vorgelesen
7. Submit Formular mit Fehler
   - ✅ Fehler wird angesagt (aria-live)
   - ✅ Feld-Status wird vermittelt (aria-invalid)

#### JAWS (Windows)

Ähnlich wie NVDA, aber kommerziell. 40-Minuten-Testmodus verfügbar.

**Download:** https://www.freedomscientific.com/

#### VoiceOver (macOS)

**Aktivierung:** `Cmd + F5`

**Wichtige Shortcuts:**
- `VO + Right/Left Arrow` - Nächstes/Vorheriges Element
- `VO + Shift + Down` - In Gruppe
- `VO + H` - Nächste Überschrift
- `VO + J` - Nächstes Formularfeld

**Test ähnlich wie NVDA:**
1. Aktiviere VoiceOver
2. Navigiere durch Seite
3. Prüfe Überschriften, Links, Formulare
4. Teste Modal-Dialoge

### 3. Mobile Screen Reader Tests

#### VoiceOver (iOS)

**Aktivierung:**
Einstellungen → Bedienungshilfen → VoiceOver → Ein

**Gesten:**
- Wisch rechts/links - Nächstes/Vorheriges Element
- Doppeltipp - Element aktivieren
- Zwei-Finger-Scrub (Z-Bewegung) - Zurück/Schließen

**Test-Szenarien:**

**A. Bottom Navigation**
1. VoiceOver aktivieren
2. Wische zu Bottom Navigation
3. Prüfe: Jeder Tab wird angesagt
   - ✅ "Planer, Button, zur Essensplanung wechseln"
   - ✅ "Ausgewählt" wird angegeben
4. Doppeltipp auf Tab
5. Prüfe: Navigation erfolgt
6. Prüfe: "Ausgewählt" wechselt

**B. Listen und Gruppierungen**
1. Öffne Rezeptliste
2. Wische durch Rezepte
3. Prüfe: Gruppierung von Titel, Beschreibung, etc.
4. Prüfe: Scrollbare Bereiche werden angegeben

**C. Buttons und Actions**
1. Finde "Speichern" Button
2. Prüfe: Label ist beschreibend
3. Prüfe: Hint gibt Kontext
4. Doppeltipp
5. Prüfe: Bestätigung wird angesagt

#### TalkBack (Android)

**Aktivierung:**
Einstellungen → Bedienungshilfen → TalkBack → Ein

**Gesten:** Ähnlich wie VoiceOver

**Test:** Gleiche Szenarien wie VoiceOver

### 4. Kontrast-Tests

#### Manuelle Prüfung mit Color Contrast Analyser

**Tool Download:**
```
https://www.tpgi.com/color-contrast-checker/
```

**Vorgehen:**
1. Screenshot der Seite
2. Öffne im CCA Tool
3. Wähle Vordergrund- und Hintergrundfarbe
4. Prüfe Kontrastverhältnis

**Mindestanforderungen:**
- Normal Text (< 18pt / < 14pt bold): **4.5:1**
- Large Text (≥ 18pt / ≥ 14pt bold): **3:1**
- UI Components (Buttons, Icons): **3:1**
- Focus Indicators: **3:1**

**Zu prüfende Elemente:**
- [ ] Body Text auf Weiß
- [ ] Links
- [ ] Buttons (alle States: default, hover, focus, active, disabled)
- [ ] Formularfelder
- [ ] Icons
- [ ] Error Messages
- [ ] Focus Indicators

#### Browser DevTools

**Chrome DevTools:**
1. Öffne DevTools (F12)
2. Elements Tab
3. Wähle Element mit Text
4. Unter "Styles" → Farbe anklicken
5. Kontrast-Info wird angezeigt
6. ✅ Grünes Häkchen = WCAG AA erfüllt

### 5. Zoom & Skalierung Tests

#### 200% Zoom Test (Web)

**Browser-Zoom:**
1. Öffne Seite
2. Zoom auf 200% (`Ctrl/Cmd + +`)
3. Prüfe:
   - ✅ Kein horizontales Scrollen
   - ✅ Text ist lesbar
   - ✅ Keine überlappenden Elemente
   - ✅ Alle Funktionen erreichbar
   - ✅ Buttons sind klickbar

**Kritische Seiten:**
- Landing Page
- Login/Register
- Meal Planner
- Recipe Detail
- Forms

#### Text Spacing Test

**Bookmarklet:**
```javascript
javascript:(function(){var s=document.createElement('style');s.innerHTML='*{line-height:1.5!important;letter-spacing:0.12em!important;word-spacing:0.16em!important}p{margin-bottom:2em!important}';document.head.appendChild(s);})();
```

1. Erstelle Bookmark mit obigem Code
2. Öffne Seite
3. Klicke Bookmark
4. Prüfe: Kein Text abgeschnitten, kein Überlapp

#### Mobile Dynamic Type (iOS)

1. Einstellungen → Anzeige & Helligkeit → Textgröße
2. Schieber auf Maximum
3. Öffne CookSona App
4. Prüfe:
   - ✅ Text skaliert
   - ✅ Layout passt sich an
   - ✅ Nichts abgeschnitten
   - ✅ Buttons bleiben bedienbar

### 6. Touch Target Tests (Mobile)

#### Manuelle Messung

**iOS:** Minimum 44×44 pt  
**Android:** Minimum 48×48 dp

**Vorgehen:**
1. Öffne App in Simulator/Emulator
2. Aktiviere Layout-Bounds (Developer Options)
3. Messe interaktive Elemente
4. Prüfe Abstände zwischen Elementen

**Kritische Elemente:**
- [ ] Bottom Navigation Tabs
- [ ] Buttons in Listen
- [ ] Close/Back Buttons
- [ ] Icon Buttons
- [ ] Checkboxes/Radio Buttons

#### Xcode View Debugger (iOS)

1. App in Simulator starten
2. Xcode → Debug → View Debugging → Capture View Hierarchy
3. 3D-Ansicht inspizieren
4. Frame-Größen prüfen

### 7. Reduced Motion Tests

#### Web

**Aktivierung:**

**macOS:**
System Preferences → Accessibility → Display → Reduce Motion

**Windows 10/11:**
Settings → Ease of Access → Display → Show animations in Windows

**Test:**
1. Aktiviere Reduced Motion
2. Öffne CookSona
3. Prüfe:
   - ✅ Keine Fade-Ins/Fade-Outs
   - ✅ Keine Slide-Animationen
   - ✅ Keine Parallax-Effekte
   - ✅ Instant Transitions statt Animationen
   - ✅ Funktionalität bleibt erhalten

#### Mobile

**iOS:**
Settings → Accessibility → Motion → Reduce Motion

**Android:**
Settings → Accessibility → Remove animations

**Test ähnlich wie Web**

## Test-Protokoll Vorlage

### Session Info
- Datum: _______________
- Tester: _______________
- Platform: Web / iOS / Android
- Browser/OS Version: _______________
- Test Type: Automatisiert / Manuell

### Checklist

#### Tastatur-Navigation (Web)
- [ ] Skip-Link funktioniert
- [ ] Alle Elemente per Tab erreichbar
- [ ] Fokus immer sichtbar
- [ ] Logische Tab-Reihenfolge
- [ ] ESC schließt Modals
- [ ] Keine Fokusfallen

#### Screen Reader
- [ ] Page Title korrekt
- [ ] Überschriften-Hierarchie
- [ ] Landmarks vorhanden
- [ ] Links beschreibend
- [ ] Formular-Labels verknüpft
- [ ] Fehler werden angesagt
- [ ] Bilder haben Alt-Text

#### Mobile Accessibility
- [ ] VoiceOver/TalkBack funktioniert
- [ ] Touch Targets ≥ 44pt/48dp
- [ ] Dynamic Type/Font Scaling
- [ ] Navigationsgesten
- [ ] Gruppierungen korrekt

#### Visuell
- [ ] Kontraste ≥ 4.5:1 (Text)
- [ ] Kontraste ≥ 3:1 (UI/Large Text)
- [ ] 200% Zoom funktioniert
- [ ] Kein horizontales Scrollen
- [ ] Info nicht nur durch Farbe

#### Animationen
- [ ] Reduced Motion respektiert
- [ ] Kein Autoplay
- [ ] Keine blitzenden Inhalte

### Gefundene Issues

| # | Severity | Element | Beschreibung | WCAG Criterion |
|---|----------|---------|--------------|----------------|
| 1 | Critical | Login Button | Kein Fokusindikator | 2.4.7 |
| 2 | Serious | Recipe Image | Fehlendes alt Attribut | 1.1.1 |

**Severity:**
- **Critical:** Funktionalität nicht nutzbar
- **Serious:** Große Hürde, Umgehung schwierig
- **Moderate:** Hürde vorhanden, Umgehung möglich
- **Minor:** Kosmetisch, keine echte Barriere

## Reporting

### Issue Template

```markdown
**Title:** [Component] - [Brief Description]

**Description:**
Detailed description of the accessibility issue.

**Steps to Reproduce:**
1. Go to page X
2. Tab to element Y
3. Observe Z

**Expected Behavior:**
Element should have visible focus indicator.

**Actual Behavior:**
No focus indicator visible.

**WCAG Criterion:** 2.4.7 Focus Visible (Level AA)

**Impact:** Users navigating with keyboard cannot see where they are.

**Severity:** Serious

**User Groups Affected:**
- Keyboard users
- Users with motor disabilities
- Screen reader users

**Suggested Fix:**
Add CSS outline: 3px solid #4A6C6F to :focus-visible state.

**Screenshots:**
[Attach screenshots]

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- Device: Desktop
```

## Tools Reference

### Chrome Extensions
- axe DevTools
- WAVE Evaluation Tool
- Lighthouse (built-in)

### Standalone Tools
- Colour Contrast Analyser (CCA)
- NVDA Screen Reader
- Pa11y CI

### Online Tools
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- WAVE Web Accessibility Evaluation Tool: https://wave.webaim.org/

## Best Practices

1. **Test früh und oft** - Nicht bis Release warten
2. **Automatisiert UND manuell** - Automatisierung findet ~30-40% der Issues
3. **Mit echten Nutzern testen** - Ideal: Menschen mit Behinderungen einbeziehen
4. **Dokumentieren** - Issues tracken und Fix verifizieren
5. **Schulungen** - Team regelmäßig trainieren

## Support

Bei Fragen zum Testing:
- **E-Mail:** barrierefreiheit@cooksona.de
- **Dokumentation:** ACCESSIBILITY.md
- **Issues:** GitHub Issues mit Label `accessibility`

---

**Version:** 1.0.0  
**Stand:** 24. Oktober 2025
