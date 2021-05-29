/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { DisplayStrings } from "@capacitor-community/bluetooth-le";
import { BleClient } from "@capacitor-community/bluetooth-le";
import * as assert from "uvu/assert";

import { confirmAlert, showAlert } from "../helpers/showAlert";

import { describe, it } from "./testRunner";

export async function testDisplayStrings(): Promise<void> {
  await describe("DisplayStrings", async () => {
    await it("should initialize", async () => {
      await BleClient.initialize();
      assert.is.not(BleClient, undefined);
    });

    await it("should show display strings from config", async () => {
      await showAlert("'Am Scannen...' and 'Cancel'");

      await BleClient.requestDevice({
        namePrefix: "Test",
      }).catch(error => console.log(error));

      const ok = await confirmAlert();
      assert.ok(ok);
    });

    await it("should show display DE strings", async () => {
      await showAlert("'Am Scannen...' and 'Abbrechen'");

      const displayStrings: DisplayStrings = {
        scanning: "Am Scannen...",
        cancel: "Abbrechen",
        availableDevices: "Verfügbare Geräte",
        noDeviceFound: "Kein Gerät gefunden",
      };
      await BleClient.setDisplayStrings(displayStrings);

      await BleClient.requestDevice({
        namePrefix: "Test",
      }).catch(error => console.log(error));

      const ok = await confirmAlert();
      assert.ok(ok);
    });

    await it("should show display EN strings", async () => {
      await showAlert("'Scanning...' and 'Cancel'");

      const displayStrings: DisplayStrings = {
        scanning: "Scanning...",
        cancel: "Cancel",
        availableDevices: "Available devices",
        noDeviceFound: "No device found",
      };
      await BleClient.setDisplayStrings(displayStrings);

      await BleClient.requestDevice({
        namePrefix: "Test",
      }).catch(error => console.log(error));

      const ok = await confirmAlert();
      assert.ok(ok);
    });

    await it("should show partial override", async () => {
      await showAlert("'Scanning...' and 'Abbrechen'");

      const displayStrings: DisplayStrings = {
        cancel: "Abbrechen",
      };
      await BleClient.setDisplayStrings(displayStrings);

      await BleClient.requestDevice({
        namePrefix: "Test",
      }).catch(error => console.log(error));

      const ok = await confirmAlert();
      assert.ok(ok);
    });
  });
}
