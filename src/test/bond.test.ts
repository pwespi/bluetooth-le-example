import type { BleDevice } from "@capacitor-community/bluetooth-le";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import * as assert from "uvu/assert";

import { EV_SERVICE } from "../helpers/ble";
import { showAlert } from "../helpers/showAlert";
import { sleep } from "../helpers/sleep";

import { assertThrows } from "./assertThrows";
import { describe, it } from "./testRunner";

export async function testBond(): Promise<void> {
  await describe("Bond", async () => {
    let device: BleDevice | null = null;

    await it("should initialize", async () => {
      await BleClient.initialize();
      assert.is.not(BleClient, undefined);
    });

    await it("should request device", async () => {
      device = await BleClient.requestDevice({
        namePrefix: "Polar",
        optionalServices: [EV_SERVICE],
      });
      assert.is.not(device, null);
      assert.ok(device.deviceId.length > 0);
    });

    await it("should not be bonded", async () => {
      if (Capacitor.getPlatform() === "android") {
        await showAlert("Make sure the device is not bonded.");
        const result = await BleClient.isBonded(device!.deviceId);
        assert.is(result, false);
      } else {
        await assertThrows(async () => {
          await BleClient.isBonded(device!.deviceId);
        }, "Unavailable");
      }
    });

    await it("should handle canceling a bonding request", async () => {
      if (Capacitor.getPlatform() === "android") {
        await showAlert("Press 'Cancel' on the bonding alert.");
        await assertThrows(async () => {
          await BleClient.createBond(device!.deviceId);
        }, "Creating bond failed");
      } else {
        await assertThrows(async () => {
          await BleClient.createBond(device!.deviceId);
        }, "Unavailable");
      }
    });

    await it("should bond", async () => {
      if (Capacitor.getPlatform() === "android") {
        await sleep(6000);
        await showAlert("Press 'Pair' on the bonding alert.");
        await BleClient.createBond(device!.deviceId);
      } else {
        await assertThrows(async () => {
          await BleClient.createBond(device!.deviceId);
        }, "Unavailable");
      }
    });

    await it("should be bonded", async () => {
      if (Capacitor.getPlatform() === "android") {
        const result = await BleClient.isBonded(device!.deviceId);
        assert.is(result, true, "should be bonded");
      } else {
        await assertThrows(async () => {
          await BleClient.isBonded(device!.deviceId);
        }, "Unavailable");
      }
    });
  });
}
