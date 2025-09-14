# Cooksona – Monorepo (Nx) mit Web (Angular) & Mobile (NativeScript + Angular)

**Struktur**

- **Web-App (Angular):** `apps/web`
- **Mobile-App (NativeScript + Angular):** `apps/mobile`
- **Geteilte Bibliotheken (optional):** `libs/`

> Nx-Workspace mit zwei Apps; Logik/Modelle/Services können über `libs/` geteilt werden.

---

## Voraussetzungen

- **Node.js** LTS + **npm**
- **Nx** (lokal via `npx`, keine globale Installation nötig)
- **NativeScript CLI** _(global empfohlen)_

```bash
npm i -g nativescript
ns -v
ns doctor
```

- **Android**: Android Studio + SDK; Emulator **oder** USB-Gerät (USB-Debugging)
- **iOS** _(nur macOS)_: Xcode + **CocoaPods**

```bash
sudo gem install cocoapods
```

> **Wichtig:** Nur **ein** `node_modules` im **Repo-Root**; **keine** `node_modules` in `apps/*`.

---

## Installation

```bash
# im Repo-Root
npm install
```

---

## Projektstruktur (Zielbild)

```text
<repo-root>/
├─ nx.json
├─ package.json
├─ tsconfig.base.json
├─ apps/
│  ├─ web/
│  │  ├─ project.json
│  │  ├─ tsconfig.app.json
│  │  ├─ tsconfig.spec.json
│  │  └─ src/...
│  └─ mobile/
│     ├─ project.json
│     ├─ nativescript.config.ts
│     ├─ App_Resources/  (Android/iOS)
│     └─ src/ bzw. app/  (je nach Template)
└─ libs/                  # (optional) geteilte Bibliotheken
```

---

## Web – Entwicklung & Build (Angular, Nx)

**Entwicklung (Dev-Server):**

```bash
npx nx serve web
```

**Production-Build:**

```bash
npx nx build web
# Output: dist/apps/web
```

**Lint/Tests (falls konfiguriert):**

```bash
npx nx lint web
npx nx test web
```

---

## Mobile – Entwicklung & Build (NativeScript + Angular)

Du kannst entweder **(A) Nx-Targets** nutzen (bequem für Dev) oder **(B) die NativeScript-CLI** (bewährt v. a. für Releases).

### A) Über Nx (Dev-Empfehlung)

**Verfügbare Targets anzeigen:**

```bash
npx nx show project mobile
```

**Android – Dev/Debug:**

```bash
# Emulator oder Gerät gestartet/angeschlossen
npx nx debug mobile android
# Alternativ:
npx nx run mobile:android
```

**iOS – Dev/Debug (nur macOS):**

```bash
npx nx debug mobile ios
# Alternativ:
npx nx run mobile:ios
```

### B) Über NativeScript-CLI (Dev & Release)

> Ausführung **im Mobile-Verzeichnis**

```bash
cd apps/mobile
```

**Android – Dev/Debug:**

```bash
ns run android
# Debug:
ns debug android
```

**iOS – Dev/Debug (nur macOS):**

```bash
ns run ios
# Debug:
ns debug ios
```

---

## Release-Builds – Mobile

### Android – Release (APK / AAB)

**Keystore erzeugen (einmalig):**

```bash
keytool -genkeypair -v \
  -keystore my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

**APK (Release):**

```bash
cd apps/mobile
ns build android --release \
  --keyStorePath ./my-release-key.keystore \
  --keyStorePassword <PASSWORD> \
  --keyStoreAlias my-key-alias \
  --keyStoreAliasPassword <ALIAS_PASSWORD>
```

**AAB (Play Console):**

```bash
cd apps/mobile
ns build android --release --aab \
  --keyStorePath ./my-release-key.keystore \
  --keyStorePassword <PASSWORD> \
  --keyStoreAlias my-key-alias \
  --keyStoreAliasPassword <ALIAS_PASSWORD>
```

**Artefakte (typisch):**

- APK: `platforms/android/app/build/outputs/apk/release/app-release.apk`
- AAB: `platforms/android/app/build/outputs/bundle/release/app-release.aab`

### iOS – Release (für Geräte / App Store)

**Geräte-Build (Codesigning erforderlich):**

```bash
cd apps/mobile
ns build ios --release --for-device \
  --provision <PROVISIONING_PROFILE_NAME_OR_UUID> \
  --teamId <APPLE_TEAM_ID>
```

> Alternativ: Nach `ns build ios --release --for-device` das Xcode-Projekt unter `platforms/ios` öffnen, **Signing & Capabilities** setzen und **Archive** (Product → Archive) erstellen.

---

## Geteilte Logik (Code-Sharing)

Lege gemeinsam genutzte Logik in **`libs/`** ab und importiere sie in Web & Mobile.

**Libs anlegen (Beispiele):**

```bash
# reine TS-/Domänenlogik (ohne Angular)
npx nx g @nx/js:lib shared-util

# Angular-Services/Guards/State (ohne Browser-APIs!)
npx nx g @nx/angular:lib shared-data --standalone
```

**Wichtig (Mobile-Kompatibilität):** In geteilten Libs **keine** direkten Browser-APIs (`window`, `document`, `localStorage`). Verwende Adapter/Ports:

```ts
// libs/shared-data/src/lib/storage.port.ts
export abstract class StoragePort {
  abstract get(key: string): string | null;
  abstract set(key: string, val: string): void;
}

// apps/web/src/app/storage.web.ts
export class WebStorage implements StoragePort {
  get(k) {
    return localStorage.getItem(k);
  }
  set(k, v) {
    localStorage.setItem(k, v);
  }
}

// apps/mobile/src/app/storage.native.ts
import { ApplicationSettings } from "@nativescript/core";
export class NativeStorage implements StoragePort {
  get(k) {
    return ApplicationSettings.getString(k);
  }
  set(k, v) {
    ApplicationSettings.setString(k, v);
  }
}
```

**Optionale Pfadaliases (`tsconfig.base.json`):**

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@app/*": ["apps/web/src/app/*"],
      "@libs/*": ["libs/*"]
    }
  }
}
```

---

## Troubleshooting (Kurz)

- **`document is not defined` (Mobile):** Browser-API in geteilter Lib → über Adapter lösen (s. oben).
- **Android-Emulator wird nicht gefunden:** AVD in Android Studio erstellen **und starten**, dann `ns run android` / `npx nx debug mobile android`.
- **iOS Signing/Provisioning Fehler:** `--teamId` / `--provision` korrekt setzen oder in Xcode konfigurieren und archivieren.
- **Build hängt / Altlasten:**

```bash
# Root:
npx nx reset
# Mobile:
cd apps/mobile && ns clean && rm -rf platforms
```

- **Tailwind (nur Web):** In `tailwind.config.cjs` muss `content` auf `apps/web/src/**/*.{html,ts}` zeigen.

---

## Quick-Ref (Cheatsheet)

```bash
# Installation (Root)
npm install

# Web
npx nx serve web
npx nx build web

# Mobile – Nx (Dev)
npx nx debug mobile android
npx nx debug mobile ios
# oder:
npx nx run mobile:android
npx nx run mobile:ios

# Mobile – CLI (Dev/Release)
cd apps/mobile
ns run android
ns run ios
ns build android --release --aab --keyStorePath ... --keyStorePassword ... --keyStoreAlias ... --keyStoreAliasPassword ...
ns build ios --release --for-device --provision <UUID> --teamId <TEAMID>
```
