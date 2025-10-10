import { NativeScriptConfig } from '@nativescript/core';

export default {
  id: 'com.shawnkastner.cooksona',
  appResourcesPath: 'App_Resources',
  android: {
    v8Flags: '--expose_gc',
    markingMode: 'none',
    codeCache: true,
    suppressCallJSMethodExceptions: false,
  },
  ios: {
    discardUncaughtJsExceptions: false,
    deploymentTarget: '15.0',
  },
  appPath: 'src',
} as NativeScriptConfig;
