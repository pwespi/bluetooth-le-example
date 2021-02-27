/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { BleDevice } from "@capacitor-community/bluetooth-le";
import {
  BleClient,
  numbersToDataView,
  ScanMode,
} from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import * as assert from "uvu/assert";

import {
  BATTERY_CHARACTERISTIC,
  BATTERY_SERVICE,
  BODY_SENSOR_LOCATION_CHARACTERISTIC,
  DEVICE_INFORMATION_SERVICE,
  GENERIC_SERVICE,
  HEART_RATE_MEASUREMENT_CHARACTERISTIC,
  HEART_RATE_SERVICE,
  HUMIDITY_SERVICE,
  POLAR_PMD_CONTROL_POINT,
  POLAR_PMD_SERVICE,
  TEMPERATURE_CHARACTERISTIC,
  TEMPERATURE_SERVICE,
} from "../helpers/ble";
import { showAlert } from "../helpers/showAlert";
import { sleep } from "../helpers/sleep";

import { describe, it } from "./testRunner";

export async function testMultipleDevices(): Promise<void> {
  await describe("Multiple Devices", async () => {
    let device1: BleDevice | null = null;
    let device2: BleDevice | null = null;

    await it("should initialize", async () => {
      await BleClient.initialize();
      assert.is.not(BleClient, undefined);
    });

    await it("should request two devices", async () => {
      if (Capacitor.getPlatform() === "web") {
        // web requires user interaction for requestDevice
        await showAlert("requestDevice");
      }
      device1 = await BleClient.requestDevice({
        namePrefix: 'Polar',
        services: [HEART_RATE_SERVICE],
        optionalServices: [BATTERY_SERVICE],
      });

      assert.is.not(device1, null);
      assert.ok(device1.name!.includes("Polar"));
      assert.ok(device1.deviceId.length > 0);

      if (Capacitor.getPlatform() === "web") {
        // web requires user interaction for requestDevice
        await showAlert("requestDevice");
      }
      device2 = await BleClient.requestDevice({
        name: "Smart Humigadget",
        optionalServices: [
          GENERIC_SERVICE,
          DEVICE_INFORMATION_SERVICE,
          BATTERY_SERVICE,
          TEMPERATURE_SERVICE,
          HUMIDITY_SERVICE,
        ],
        scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
      });

      assert.is.not(device2, null);
      assert.ok(device2.name!.includes("Smart"));
      assert.ok(device2.deviceId.length > 0);
    });

    await it("should connect", async () => {
      await BleClient.connect(device1!.deviceId);
      await BleClient.connect(device2!.deviceId);
      assert.ok(true);
    });

    await it("should read body sensor location and read battery level", async () => {
      const result1 = await BleClient.read(
        device1!.deviceId,
        HEART_RATE_SERVICE,
        BODY_SENSOR_LOCATION_CHARACTERISTIC,
      );
      const result2 = await BleClient.read(
        device2!.deviceId,
        BATTERY_SERVICE,
        BATTERY_CHARACTERISTIC,
      );

      assert.is(result1.getUint8(0), 1);
      assert.ok(result2.getUint8(0) > 10 && result2.getUint8(0) <= 100);
    });

    await it("should write to control point", async () => {
      await BleClient.write(
        device1!.deviceId,
        POLAR_PMD_SERVICE,
        POLAR_PMD_CONTROL_POINT,
        numbersToDataView([1, 0]),
      );
      assert.ok(true);
    });

    await it("should handle notifications", async () => {
      let hrCount = 0;
      let tCount = 0;
      await BleClient.startNotifications(
        device1!.deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT_CHARACTERISTIC,
        value => {
          const hr = value.getUint8(1);
          hrCount += 1;
          console.log("hr", hr);
          assert.ok(hr > 50 && hr < 100);
        },
      );
      await BleClient.startNotifications(
        device2!.deviceId,
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
      console.log("stop");
      await BleClient.stopNotifications(
        device1!.deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT_CHARACTERISTIC,
      );
      await BleClient.stopNotifications(
        device2!.deviceId,
        TEMPERATURE_SERVICE,
        TEMPERATURE_CHARACTERISTIC,
      );
      console.log("hrCount", hrCount);
      console.log("tCount", tCount);
      assert.ok(hrCount > 6 && hrCount <= 8);
      assert.ok(tCount > 6 && tCount <= 8);
    });

    await it("should disconnect", async () => {
      await BleClient.disconnect(device1!.deviceId);
      await BleClient.disconnect(device2!.deviceId);
      assert.ok(true);
    });

    await it("should receive disconnected event when device is turned off", async () => {
      // wait after disconnect above
      await sleep(5000);
      let receivedDisconnectedEvent = false;
      let disconnectedFrom = "";
      await BleClient.connect(device2!.deviceId, disconnectedDeviceId => {
        disconnectedFrom = disconnectedDeviceId;
        receivedDisconnectedEvent = true;
      });
      const battery = await BleClient.read(
        device2!.deviceId,
        BATTERY_SERVICE,
        BATTERY_CHARACTERISTIC,
      );
      assert.ok(battery.getUint8(0) > 10 && battery.getUint8(0) <= 100);
      assert.is(receivedDisconnectedEvent, false);
      assert.is(disconnectedFrom, "");
      await showAlert("Disconnect Humigadget");
      await sleep(3000);
      assert.ok(receivedDisconnectedEvent);
      assert.is(disconnectedFrom, device2!.deviceId);
    });
  });
}
