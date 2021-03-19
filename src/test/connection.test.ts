/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BleDevice } from "@capacitor-community/bluetooth-le";
import { BleClient, ScanMode } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import * as assert from "uvu/assert";
import { BATTERY_CHARACTERISTIC, BATTERY_SERVICE } from "../helpers/ble";
import { showAlert } from "../helpers/showAlert";
import { sleep } from "../helpers/sleep";
import { assertThrows } from "./assertThrows";
import { describe, it } from "./testRunner";

export async function testConnection(): Promise<void> {
  await describe("Connection", async () => {
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
        optionalServices: [BATTERY_SERVICE],
        scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
      });

      assert.is.not(device1, null);
      assert.ok(device1.name!.includes("Smart"), "device name");
      assert.ok(device1.deviceId.length > 0, "device id");
    });

    await it("should not yet be connected", async () => {
      await assertThrows(async () => {
        await BleClient.read(
          device1!.deviceId,
          BATTERY_SERVICE,
          BATTERY_CHARACTERISTIC,
        );
      }, "connected"); // "not connected" or "disconnected"
      assert.ok(true);
    });

    await it("should receive disconnected event when device is turned off", async () => {
      let receivedDisconnectedEvent = false;
      let disconnectedFrom = "";
      await BleClient.connect(device1!.deviceId, disconnectedDeviceId => {
        console.log("disconnected event");
        disconnectedFrom = disconnectedDeviceId;
        receivedDisconnectedEvent = true;
      });
      const value = await BleClient.read(
        device1!.deviceId,
        BATTERY_SERVICE,
        BATTERY_CHARACTERISTIC,
      );
      assert.ok(0 < value.getUint8(0) && value.getUint8(0) <= 100);
      assert.is(
        receivedDisconnectedEvent,
        false,
        "not yet received disconnected event",
      );
      assert.is(disconnectedFrom, "", "not yet disconnected");
      await showAlert("Disconnect device");
      await sleep(1000);
      assert.is(receivedDisconnectedEvent, true, "received disconnected event");
      assert.is(
        disconnectedFrom,
        device1!.deviceId,
        "correct id passed to disconnected event",
      );
    });

    await it("should not call onDisconnected on connection timeout", async () => {
      let receivedDisconnectedEvent = false;
      let disconnectedFrom = "";
      assertThrows(async () => {
        await BleClient.connect(device1!.deviceId, disconnectedDeviceId => {
          console.log("disconnected event");
          disconnectedFrom = disconnectedDeviceId;
          receivedDisconnectedEvent = true;
        });
      }, "timeout");
      await sleep(18000);
      console.log("receivedDisconnectedEvent", receivedDisconnectedEvent);
      assert.is(receivedDisconnectedEvent, false);
      assert.is(disconnectedFrom, "");
    });

    if (Capacitor.getPlatform() !== "web") {
      // cancel pending connect call, does not work yet in chromium because of a bug:
      // https://bugs.chromium.org/p/chromium/issues/detail?id=684073
      await it("should not connect after timeout", async () => {
        await showAlert("Turn device back on");
        await sleep(11000);
        await assertThrows(async () => {
          await BleClient.read(
            device1!.deviceId,
            BATTERY_SERVICE,
            BATTERY_CHARACTERISTIC,
          );
        }, "connected"); // "not connected" or "disconnected"
        assert.ok(true);
      });
    }

    await it("should connect again", async () => {
      await BleClient.connect(device1!.deviceId);
      const value = await BleClient.read(
        device1!.deviceId,
        BATTERY_SERVICE,
        BATTERY_CHARACTERISTIC,
      );
      assert.ok(0 < value.getUint8(0) && value.getUint8(0) <= 100);
      await BleClient.disconnect(device1!.deviceId);
      assert.ok(true);
    });
  });
}
