/// <reference types="@capacitor-community/bluetooth-le" />
/// <reference types="@capacitor/splash-screen" />

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.wespiapps.bluetoothle.example",
  appName: "BLE Example",
  bundledWebRuntime: false,
  webDir: "www",
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    BluetoothLe: {
      displayStrings: {
        scanning: "Am Scannen...",
        //cancel: "Abbrechen",
        availableDevices: "Verfügbare Geräte",
        noDeviceFound: "Kein Gerät gefunden",
      },
    },
  },
  cordova: {},
  server: {
    url: "http://192.168.178.24:3333",
    cleartext: true,
  },
};

export default config;
