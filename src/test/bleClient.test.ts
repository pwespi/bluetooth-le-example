/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { BleDevice } from "@capacitor-community/bluetooth-le";
import {
  BleClient,
  dataViewToNumbers,
  numbersToDataView,
} from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import * as assert from "uvu/assert";

import {
  BATTERY_CHARACTERISTIC,
  BATTERY_SERVICE,
  BODY_SENSOR_LOCATION_CHARACTERISTIC,
  HEART_RATE_MEASUREMENT_CHARACTERISTIC,
  HEART_RATE_SERVICE,
  POLAR_PMD_CONTROL_POINT,
  POLAR_PMD_DATA,
  POLAR_PMD_SERVICE,
} from "../helpers/ble";
import { showAlert } from "../helpers/showAlert";
import { sleep } from "../helpers/sleep";
import { assertThrows } from "./assertThrows";

import { describe, it } from "./testRunner";

export async function testBleClient(): Promise<void> {
  await describe("BleClient", async () => {
    let device: BleDevice | null = null;
    let deviceId = "";

    await it("should initialize", async () => {
      await BleClient.initialize();
      assert.is.not(BleClient, undefined);
    });

    await it("should request a device", async () => {
      if (Capacitor.getPlatform() === "web") {
        // web requires user interaction for requestDevice
        await showAlert("requestDevice");
      }
      device = await BleClient.requestDevice({
        namePrefix: "Polar",
        services: [HEART_RATE_SERVICE],
        optionalServices: [BATTERY_SERVICE, POLAR_PMD_SERVICE],
      });
      deviceId = device.deviceId;
      assert.is.not(device, null);
      assert.is(device.name?.includes("Polar"), true);
      assert.ok(deviceId.length > 0);
    });

    await it("should not throw when disconnecting", async () => {
      await BleClient.disconnect(deviceId);
      assert.ok(device);
    });

    await it("should connect", async () => {
      await BleClient.connect(deviceId);
      assert.ok(device);
    });

    await it("should read body sensor location", async () => {
      const result = await BleClient.read(
        deviceId,
        HEART_RATE_SERVICE,
        BODY_SENSOR_LOCATION_CHARACTERISTIC,
      );
      assert.is(result.getUint8(0), 1);
    });

    await it("should read battery level", async () => {
      const result = await BleClient.read(
        deviceId,
        BATTERY_SERVICE,
        BATTERY_CHARACTERISTIC,
      );
      const batteryLevel = result.getUint8(0);
      assert.ok(batteryLevel > 10 && batteryLevel <= 100);
    });

    await it("should write to control point", async () => {
      await BleClient.write(
        deviceId,
        POLAR_PMD_SERVICE,
        POLAR_PMD_CONTROL_POINT,
        numbersToDataView([1, 0]),
      );
      assert.ok(true);
    });

    await it("should handle notifications", async () => {
      await BleClient.startNotifications(
        deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT_CHARACTERISTIC,
        value => {
          const hr = value.getUint8(1);
          assert.ok(hr > 50 && hr < 100);
        },
      );
      await sleep(5000);
      await BleClient.stopNotifications(
        deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT_CHARACTERISTIC,
      );
      assert.ok(true);
    });

    await it("should receive notifications only once", async () => {
      let count = 0;
      await sleep(300);
      await BleClient.startNotifications(
        deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT_CHARACTERISTIC,
        value => {
          const hr = value.getUint8(1);
          count += 1;
          assert.ok(hr > 50 && hr < 100);
        },
      );
      await sleep(300);
      await BleClient.stopNotifications(
        deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT_CHARACTERISTIC,
      );
      await sleep(300);
      await BleClient.startNotifications(
        deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT_CHARACTERISTIC,
        value => {
          const hr = value.getUint8(1);
          count += 1;
          assert.ok(hr > 50 && hr < 100);
        },
      );
      await sleep(5000);
      await BleClient.stopNotifications(
        deviceId,
        HEART_RATE_SERVICE,
        HEART_RATE_MEASUREMENT_CHARACTERISTIC,
      );
      assert.ok(
        count >= 5 && count < 8,
        `count should be between 5 and 8, count is ${count}`,
      );
    });

    await it("should read ECG", async () => {
      const ecg: DataView[] = [];
      let control: DataView | null = null;

      await sleep(100);

      // listen to control
      await BleClient.startNotifications(
        deviceId,
        POLAR_PMD_SERVICE,
        POLAR_PMD_CONTROL_POINT,
        value => (control = value),
      );

      await sleep(100);

      // get ecg settings
      await BleClient.write(
        deviceId,
        POLAR_PMD_SERVICE,
        POLAR_PMD_CONTROL_POINT,
        numbersToDataView([1, 0]),
      );
      await sleep(300);
      assert.is.not(control, null, "control is not null");
      assert.equal(
        dataViewToNumbers(control!),
        [240, 1, 0, 0, 0, 0, 1, 130, 0, 1, 1, 14, 0],
        "control value is [240,1,0,0,0,0,1,130,0,1,1,14,0,]",
      );

      // listen to data
      await BleClient.startNotifications(
        deviceId,
        POLAR_PMD_SERVICE,
        POLAR_PMD_DATA,
        value => ecg.push(value),
      );

      // should not receive data before start command
      await sleep(1500);
      assert.is(ecg.length, 0, "ecg length is still 0");

      // start stream
      await BleClient.write(
        deviceId,
        POLAR_PMD_SERVICE,
        POLAR_PMD_CONTROL_POINT,
        numbersToDataView([2, 0, 0, 1, 130, 0, 1, 1, 14, 0]),
      );
      await sleep(300);
      assert.equal(
        dataViewToNumbers(control!),
        [240, 2, 0, 0, 0, 0],
        "control value is [240, 2, 0, 0, 0, 0]",
      );

      await sleep(10000);
      // if (Capacitor.getPlatform() === "web") {
      //   await sleep(30000);
      // }
      let length = ecg.length;
      console.log("length", ecg.length);
      assert.ok(length >= 5, "length is larger than or equal 5");
      console.log("bytelength", ecg[length - 1].byteLength);
      assert.ok(
        ecg[length - 1].byteLength >= 100,
        "byte length is larger than or equal 100",
      );

      // stop stream
      await BleClient.write(
        deviceId,
        POLAR_PMD_SERVICE,
        POLAR_PMD_CONTROL_POINT,
        numbersToDataView([3, 0]),
      );
      length = ecg.length;
      await sleep(300);
      assert.equal(
        dataViewToNumbers(control!),
        [240, 3, 0, 0, 0],
        "control value is [240, 3, 0, 0, 0]",
      );

      // should not receive any further values
      await sleep(3000);
      assert.is(
        ecg.length,
        length,
        `ecg length has not changed ${ecg.length} vs ${length}`,
      );

      await BleClient.stopNotifications(
        deviceId,
        POLAR_PMD_SERVICE,
        POLAR_PMD_DATA,
      );
    });

    await it("should throw when reading inexistent characteristic", async () => {
      await assertThrows(async () => {
        await BleClient.read(deviceId, "0000", "0001");
      });
      await assertThrows(async () => {
        await BleClient.read(deviceId, POLAR_PMD_SERVICE, "0001");
      });
    });

    await it("should throw when writing inexistent characteristic", async () => {
      await assertThrows(async () => {
        await BleClient.write(deviceId, "0000", "0001", numbersToDataView([1]));
      });
      await assertThrows(async () => {
        await BleClient.write(deviceId, POLAR_PMD_SERVICE, "0001", numbersToDataView([1]));
      });
    });

    await it("should throw when starting notifications on inexistent characteristic", async () => {
      await assertThrows(async () => {
        await BleClient.startNotifications(deviceId, "0000", "0001", value => console.log(value));
      });
      await assertThrows(async () => {
        await BleClient.startNotifications(deviceId, POLAR_PMD_SERVICE, "0001", value => console.log(value));
      });
    });

    await it("should disconnect", async () => {
      await BleClient.disconnect(deviceId);
      assert.ok(true);
    });

    await it("should receive disconnected event", async () => {
      let receivedDisconnectedEvent = false;
      let disconnectedFrom = "";
      await BleClient.connect(deviceId, disconnectedDeviceId => {
        disconnectedFrom = disconnectedDeviceId;
        receivedDisconnectedEvent = true;
      });
      assert.is(receivedDisconnectedEvent, false);
      assert.is(disconnectedFrom, "");
      await BleClient.disconnect(deviceId);
      assert.is(receivedDisconnectedEvent as boolean, true);
      assert.is(disconnectedFrom, deviceId);
    });

    await it("should not throw when disconnecting", async () => {
      await BleClient.disconnect(deviceId);
      assert.ok(device);
    });
  });
}
