/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BleDevice } from "@capacitor-community/bluetooth-le";
import { BleClient, ScanMode } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import * as assert from "uvu/assert";
import {
  TEMPERATURE_CHARACTERISTIC,
  TEMPERATURE_SERVICE,
} from "../helpers/ble";
import { showAlert } from "../helpers/showAlert";
import { sleep } from "../helpers/sleep";
import { describe, it } from "./testRunner";

export async function testNotificationCleanup(): Promise<void> {
  await describe("NotificationCleanup", async () => {
    let device1: BleDevice | null = null;

    await it("should initialize", async () => {
      await BleClient.initialize();
      assert.is.not(BleClient, undefined);
    });

    await it("should request device", async () => {
      if (Capacitor.getPlatform() === "web") {
        // web requires user interaction for requestDevice
        await showAlert("requestDevice");
      }
      device1 = await BleClient.requestDevice({
        namePrefix: "Smart",
        optionalServices: [TEMPERATURE_SERVICE],
        scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
      });

      assert.is.not(device1, null);
      assert.ok(device1.name!.includes("Smart"), "device name");
      assert.ok(device1.deviceId.length > 0, "device id");
    });

    await it("should connect", async () => {
      await BleClient.connect(device1!.deviceId, () => {
        console.log("disconnected event");
      });
      assert.ok(true);
    });

    await it("should receive notifications once per second", async () => {
      let tCount = 0;
      await BleClient.startNotifications(
        device1!.deviceId,
        TEMPERATURE_SERVICE,
        TEMPERATURE_CHARACTERISTIC,
        value => {
          const t = value.getFloat32(0, true);
          tCount += 1;
          console.log("temp", t);
          assert.ok(t > 19 && t < 28);
        },
      );
      await sleep(7000);
      assert.ok(tCount > 6 && tCount <= 8);
    });

    await it("should receive notifications only once after lost connection", async () => {
      await showAlert("Disconnect device and turn back on");
      await sleep(5000);
      let tCount = 0;
      await BleClient.connect(device1!.deviceId, () => {
        console.log("disconnected event");
      });
      await BleClient.startNotifications(
        device1!.deviceId,
        TEMPERATURE_SERVICE,
        TEMPERATURE_CHARACTERISTIC,
        value => {
          const t = value.getFloat32(0, true);
          tCount += 1;
          console.log("temp", t);
          assert.ok(t > 19 && t < 28);
        },
      );
      await sleep(7000);
      assert.ok(tCount > 6 && tCount <= 8, "only one notification per second");

      await BleClient.stopNotifications(
        device1!.deviceId,
        TEMPERATURE_SERVICE,
        TEMPERATURE_CHARACTERISTIC,
      );
      await BleClient.disconnect(device1!.deviceId);
    });
  });
}
