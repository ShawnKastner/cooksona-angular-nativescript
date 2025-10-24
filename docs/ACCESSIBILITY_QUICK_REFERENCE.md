# Accessibility Quick Reference Guide

## Schnellstart für Entwickler

### Web Components (Angular)

#### Button mit Icon
```html
<button
  type="button"
  class="btn-primary"
  aria-label="Rezept speichern"
  (click)="save()"
>
  <span [svgInject]="icons.Save" aria-hidden="true"></span>
  Speichern
</button>
```

#### Icon-Only Button
```html
<button
  type="button"
  class="icon-btn"
  aria-label="Rezept löschen"
  (click)="delete()"
>
  <span [svgInject]="icons.Trash" aria-hidden="true"></span>
</button>
```

#### Formularfeld mit Fehler
```html
<div class="form-group">
  <label for="recipe-name">Rezeptname</label>
  <input
    id="recipe-name"
    type="text"
    formControlName="name"
    [attr.aria-invalid]="nameField.invalid && nameField.touched"
    [attr.aria-describedby]="nameField.invalid && nameField.touched ? 'name-error' : null"
    required
    aria-required="true"
  />
  @if (nameField.invalid && nameField.touched) {
    <span id="name-error" class="error" role="alert">
      Bitte gib einen Rezeptnamen ein.
    </span>
  }
</div>
```

#### Modal/Dialog
```typescript
export class MyModal implements OnInit, OnDestroy {
  private releaseFocusTrap?: () => void;
  
  constructor(
    private elementRef: ElementRef,
    private a11y: AccessibilityService
  ) {}
  
  ngOnInit() {
    // Trap focus in modal
    this.releaseFocusTrap = this.a11y.trapFocus(
      this.elementRef.nativeElement
    );
  }
  
  ngOnDestroy() {
    // Release focus trap
    this.releaseFocusTrap?.();
  }
  
  close() {
    // Announce closing
    this.a11y.announce('Modal geschlossen');
    // Close modal...
  }
}
```

```html
<div
  class="modal"
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  aria-describedby="modal-description"
>
  <h2 id="modal-title">Modal Titel</h2>
  <p id="modal-description">Modal Beschreibung</p>
  
  <button
    type="button"
    class="close-btn"
    aria-label="Modal schließen"
    (click)="close()"
  >
    <span aria-hidden="true">&times;</span>
  </button>
  
  <!-- Modal content -->
</div>
```

#### Dropdown Menu
```html
<div class="dropdown">
  <button
    type="button"
    [attr.aria-expanded]="isOpen"
    aria-haspopup="true"
    aria-label="Menü öffnen"
    (click)="toggle()"
  >
    Menü
  </button>
  
  @if (isOpen) {
    <div role="menu" aria-label="Optionen">
      <button
        role="menuitem"
        (click)="option1()"
      >
        Option 1
      </button>
      <button
        role="menuitem"
        (click)="option2()"
      >
        Option 2
      </button>
    </div>
  }
</div>
```

#### Tab Panel
```html
<div class="tabs">
  <div role="tablist" aria-label="Rezept-Tabs">
    <button
      role="tab"
      [attr.aria-selected]="activeTab === 0"
      [attr.aria-controls]="'panel-0'"
      [attr.tabindex]="activeTab === 0 ? 0 : -1"
      id="tab-0"
      (click)="selectTab(0)"
    >
      Zutaten
    </button>
    <button
      role="tab"
      [attr.aria-selected]="activeTab === 1"
      [attr.aria-controls]="'panel-1'"
      [attr.tabindex]="activeTab === 1 ? 0 : -1"
      id="tab-1"
      (click)="selectTab(1)"
    >
      Zubereitung
    </button>
  </div>
  
  <div
    role="tabpanel"
    [attr.aria-labelledby]="'tab-0'"
    id="panel-0"
    [hidden]="activeTab !== 0"
  >
    <!-- Zutaten content -->
  </div>
  
  <div
    role="tabpanel"
    [attr.aria-labelledby]="'tab-1'"
    id="panel-1"
    [hidden]="activeTab !== 1"
  >
    <!-- Zubereitung content -->
  </div>
</div>
```

#### Loading Spinner mit Announcement
```html
<div *ngIf="isLoading">
  <div
    role="status"
    aria-live="polite"
    aria-label="Lädt..."
  >
    <app-loading-spinner />
    <span class="sr-only">Daten werden geladen...</span>
  </div>
</div>
```

#### Success/Error Messages
```html
<!-- Success -->
<div
  *ngIf="successMessage"
  role="status"
  aria-live="polite"
  class="alert alert-success"
>
  {{ successMessage }}
</div>

<!-- Error -->
<div
  *ngIf="errorMessage"
  role="alert"
  aria-live="assertive"
  class="alert alert-error"
>
  {{ errorMessage }}
</div>
```

#### Image mit Alt-Text
```html
<!-- Informatives Bild -->
<img
  [src]="recipe.image"
  [alt]="recipe.name + ' - ' + recipe.description"
/>

<!-- Dekoratives Bild -->
<img
  [src]="decorativeImage"
  alt=""
  aria-hidden="true"
/>
```

#### Link vs Button
```html
<!-- Navigation - use Link -->
<a routerLink="/recipes" class="nav-link">
  Rezepte
</a>

<!-- Action - use Button -->
<button type="button" (click)="save()">
  Speichern
</button>

<!-- Link that looks like button -->
<a routerLink="/create" class="btn btn-primary" role="button">
  Neues Rezept
</a>
```

### Mobile Components (NativeScript)

#### Button
```xml
<Button
  text="Speichern"
  accessibilityLabel="Rezept speichern"
  accessibilityHint="Speichert das aktuelle Rezept in Ihr Kochbuch"
  accessibilityRole="button"
  (tap)="save()"
  minWidth="48"
  minHeight="48"
  class="btn-primary"
/>
```

#### Label (nicht interaktiv)
```xml
<Label
  [text]="recipe.name"
  accessibilityLabel="Rezeptname: {{ recipe.name }}"
  accessibilityRole="header"
  class="recipe-title"
/>
```

#### Image
```xml
<!-- Informativ -->
<Image
  [src]="recipe.image"
  accessibilityLabel="Foto von {{ recipe.name }}"
  accessibilityRole="image"
  stretch="aspectFill"
/>

<!-- Dekorativ -->
<Image
  [src]="decorativeImage"
  accessibilityHidden="true"
  stretch="aspectFill"
/>
```

#### List Item
```xml
<StackLayout
  (tap)="selectRecipe(recipe)"
  accessibilityLabel="Rezept: {{ recipe.name }}, {{ recipe.cookingTime }} Minuten"
  accessibilityHint="Doppeltippen um Details anzuzeigen"
  accessibilityRole="button"
  minHeight="48"
>
  <Label [text]="recipe.name" accessibilityHidden="true" />
  <Label [text]="recipe.cookingTime + ' Min'" accessibilityHidden="true" />
</StackLayout>
```

#### Switch/Toggle
```xml
<Switch
  [(ngModel)]="notifications"
  accessibilityLabel="Benachrichtigungen"
  accessibilityHint="Aktiviert oder deaktiviert Push-Benachrichtigungen"
  accessibilityRole="switch"
  [accessibilityState]="notifications ? 'checked' : 'unchecked'"
  (checkedChange)="onToggle($event)"
/>
```

#### Text Input
```xml
<TextField
  hint="Rezeptname eingeben"
  [(ngModel)]="recipeName"
  accessibilityLabel="Rezeptname"
  accessibilityHint="Geben Sie einen Namen für Ihr Rezept ein"
  accessibilityRole="text"
  minHeight="48"
/>
```

#### Container with Group
```xml
<!-- Group related elements -->
<StackLayout
  accessibilityLabel="Nährwerte"
  accessibilityRole="summary"
>
  <Label text="Kalorien: 450" accessibilityHidden="true" />
  <Label text="Protein: 25g" accessibilityHidden="true" />
  <Label text="Fett: 15g" accessibilityHidden="true" />
</StackLayout>
```

## Common ARIA Roles

| Role | Wann verwenden | Beispiel |
|------|----------------|----------|
| `button` | Klickbare Aktionen | Button, Icon-Button |
| `link` | Navigation | Textlinks, Nav-Items |
| `navigation` | Navigationsbereich | Header Nav, Sidebar |
| `banner` | Site Header | `<header>` |
| `main` | Hauptinhalt | `<main>` |
| `contentinfo` | Site Footer | `<footer>` |
| `search` | Suchformular | Search Box |
| `form` | Formular | Login, Register Forms |
| `dialog` | Modal | Popup, Alert Dialog |
| `alert` | Wichtige Nachricht | Error Messages |
| `status` | Status Update | Success Message, Loading |
| `menu` | Menü | Dropdown Menu |
| `menuitem` | Menü-Element | Items in Dropdown |
| `tab` | Tab Control | Tab Navigation |
| `tabpanel` | Tab Inhalt | Tab Content Area |
| `list` | Liste | Recipe List |
| `listitem` | Listen-Element | Recipe in List |

## Common ARIA Attributes

| Attribut | Wert | Zweck |
|----------|------|-------|
| `aria-label` | String | Label für Element ohne sichtbaren Text |
| `aria-labelledby` | ID | Referenz zu Label-Element |
| `aria-describedby` | ID | Referenz zu Beschreibung/Hilfetext |
| `aria-hidden` | true/false | Element vor Screen Reader verbergen |
| `aria-live` | polite/assertive | Dynamische Updates ankündigen |
| `aria-expanded` | true/false | Zustand von Dropdown/Accordion |
| `aria-haspopup` | true/menu/dialog | Element öffnet Popup |
| `aria-controls` | ID | Element kontrolliert anderes Element |
| `aria-current` | page/step/... | Aktuelles Element in Navigation |
| `aria-invalid` | true/false | Formularfeld ungültig |
| `aria-required` | true/false | Pflichtfeld |
| `aria-modal` | true/false | Modal Dialog |

## Color Contrast Requirements

| Element | Min. Contrast | Beispiel |
|---------|---------------|----------|
| Normal Text | 4.5:1 | Body Text, Links |
| Large Text (18pt+) | 3:1 | Headings, Hero Text |
| Bold Text (14pt+) | 3:1 | Bold Paragraphs |
| UI Components | 3:1 | Buttons, Icons, Borders |
| Focus Indicators | 3:1 | :focus outline |

**Unsere Farbwerte (WCAG AA konform):**
```css
/* Text auf Weiß */
--text-primary: #1F2937;      /* 14:1 */
--text-secondary: #4B5563;    /* 7:1 */

/* Interactive auf Weiß */
--primary: #4A6C6F;           /* 4.5:1 */
--error: #DC2626;             /* 4.5:1 */
--success: #059669;           /* 4.5:1 */
--warning: #D97706;           /* 4.5:1 */
```

## Touch Target Sizes

| Platform | Minimum | Ideal | Spacing |
|----------|---------|-------|---------|
| iOS | 44×44 pt | 48×48 pt | 8pt |
| Android | 48×48 dp | 56×56 dp | 8dp |
| Web | 44×44 px | 48×48 px | 8px |

**CSS Helper:**
```css
/* Web */
.btn {
  min-width: 44px;
  min-height: 44px;
  padding: 12px 16px;
}

/* NativeScript */
<Button
  minWidth="48"
  minHeight="48"
  class="btn"
/>
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Next element |
| `Shift + Tab` | Previous element |
| `Enter` | Activate button/link |
| `Space` | Activate button, toggle checkbox |
| `Esc` | Close modal/dropdown |
| `Arrow Keys` | Navigate within component (tabs, menu) |
| `Home` | First item (lists, menus) |
| `End` | Last item (lists, menus) |

## Screen Reader Shortcuts

### NVDA (Windows)
| Key | Action |
|-----|--------|
| `H` | Next heading |
| `1-6` | Heading level 1-6 |
| `L` | Next list |
| `I` | Next list item |
| `F` | Next form field |
| `B` | Next button |
| `K` | Next link |

### VoiceOver (macOS)
| Key | Action |
|-----|--------|
| `VO + Right/Left` | Next/Previous |
| `VO + Shift + Down` | Enter group |
| `VO + Shift + Up` | Exit group |
| `VO + H` | Next heading |

### Mobile Gestures
| Gesture | Action |
|---------|--------|
| Swipe right | Next |
| Swipe left | Previous |
| Double-tap | Activate |
| Two-finger scrub (Z) | Back/Close |

## Testing Checklist

### Per Component
- [ ] Keyboard accessible
- [ ] Visible focus indicator
- [ ] Screen reader friendly (test with NVDA/VoiceOver)
- [ ] Touch targets ≥ 44pt/48dp (mobile)
- [ ] Color contrast ≥ 4.5:1
- [ ] Labels for form fields
- [ ] Error states with aria-invalid
- [ ] Loading states announced
- [ ] Works at 200% zoom

### Before Commit
```bash
# Run automated tests
npm run a11y:test

# Manual checks
# - Tab through component
# - Test with screen reader
# - Check contrast with DevTools
```

## Common Mistakes ❌

### DON'T
```html
<!-- ❌ Icon without label -->
<button (click)="delete()">
  <svg>...</svg>
</button>

<!-- ❌ Div as button -->
<div (click)="save()">Save</div>

<!-- ❌ Label not connected -->
<label>Email</label>
<input type="email" />

<!-- ❌ Click me -->
<a href="#">Click here</a>

<!-- ❌ Color only -->
<span style="color: red">Error</span>

<!-- ❌ Low contrast -->
<p style="color: #999">Text</p>
```

### DO ✅
```html
<!-- ✅ Icon with label -->
<button (click)="delete()" aria-label="Delete recipe">
  <svg aria-hidden="true">...</svg>
</button>

<!-- ✅ Real button -->
<button type="button" (click)="save()">Save</button>

<!-- ✅ Label connected -->
<label for="email">Email</label>
<input type="email" id="email" />

<!-- ✅ Descriptive link -->
<a routerLink="/recipes">View all recipes</a>

<!-- ✅ Color + icon + text -->
<span class="error">
  <svg aria-hidden="true">...</svg>
  Error: Invalid input
</span>

<!-- ✅ High contrast -->
<p style="color: #1F2937">Text</p>
```

## Resources

- **Docs:** `/workspace/ACCESSIBILITY.md`
- **Testing:** `/workspace/TESTING_GUIDE.md`
- **Service:** `AccessibilityService` (Web), `MobileAccessibilityService` (Mobile)
- **Tests:** `npm run a11y:test`

## Questions?

**E-Mail:** barrierefreiheit@cooksona.de  
**Team Contact:** Accessibility Champion im Team fragen
