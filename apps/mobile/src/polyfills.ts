/**
 * NativeScript Polyfills
 */

// Install @nativescript/core polyfills (XHR, setTimeout, requestAnimationFrame)
import '@nativescript/core/globals';
// Install @nativescript/angular specific polyfills
import '@nativescript/angular/polyfills';

import 'event-target-shim';
import 'abort-controller/polyfill';

if (typeof (globalThis as any).AbortController === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ac = require('abort-controller');
  (globalThis as any).AbortController = ac.AbortController ?? ac;
}
