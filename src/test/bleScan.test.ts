/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { ScanResult } from "@capacitor-community/bluetooth-le";
import { BleClient } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import * as assert from "uvu/assert";

import { HEART_RATE_SERVICE } from "../helpers/ble";
import { showAlert } from "../helpers/showAlert";
import { sleep } from "../helpers/sleep";

import { describe, it } from "./testRunner";

export async function testBleScan(): Promise<void> {
  await describe("Ble Scan", async () => {
    await it("should find test device with correct adv. data", async () => {
      const results: ScanResult[] = [];
      if (Capacitor.getPlatform() === "web") {
        // web requires user interaction
        console.log(
          `await navigator.bluetooth.requestLEScan({ filters: [{ services: ['0000180d-0000-1000-8000-00805f9b34fb'] }] })`,
        );
        await showAlert("requestLEScan");
      }
      await BleClient.requestLEScan(
        {
          services: [HEART_RATE_SERVICE],
          namePrefix: "zyx",
        },
        result => {
          if (result !== undefined) {
            results.push(result);
          }
        },
      );
      await sleep(3000);
      await BleClient.stopLEScan();
      console.log("results", results);
      assert.ok(results.length >= 1);
      const scanResult = results.find(r => r.device?.name === "zyx");
      assert.ok(scanResult);
      assert.ok(scanResult!.device.deviceId.length > 0);
      assert.is(scanResult!.device.name, "zyx");
      assert.is(scanResult!.localName, "zyx");
      assert.ok(scanResult!.rssi > -100 && scanResult!.rssi < -10);
      assert.ok(scanResult!.txPower >= -127 && scanResult!.txPower <= 127);
      const manufacturerData = scanResult!.manufacturerData!["1281"];
      assert.is(manufacturerData.getUint8(0), 238);
      assert.is(manufacturerData.getUint8(1), 0);
      assert.is(manufacturerData.getUint8(2), 255);
      const serviceData = scanResult!.serviceData![
        "0000180d-0000-1000-8000-00805f9b34fb"
      ];
      assert.is(serviceData.getUint8(0), 255);
      assert.is(serviceData.getUint8(1), 0);
      assert.is(serviceData.getUint8(2), 238);
      assert.is(scanResult!.uuids![0], "0000180d-0000-1000-8000-00805f9b34fb");
      if (Capacitor.getPlatform() === "android") {
        assert.ok(scanResult!.rawAdvertisement!.byteLength > 10);
      }
    });

    await it("should allow duplicates", async () => {
      const results: ScanResult[] = [];
      if (Capacitor.getPlatform() === "web") {
        // web requires user interaction
        console.log(
          `await navigator.bluetooth.requestLEScan({ filters: [{ services: ['0000180d-0000-1000-8000-00805f9b34fb'], keepRepeatedDevices: true, namePrefix: 'zyx' }] })`,
        );
        await showAlert("requestLEScan");
      }
      await BleClient.requestLEScan(
        {
          services: [HEART_RATE_SERVICE],
          namePrefix: "zyx",
          allowDuplicates: true,
        },
        result => {
          results.push(result);
        },
      );
      await sleep(5000);
      await BleClient.stopLEScan();
      console.log("results", results);
      assert.ok(results.length > 1);
      results.forEach(r => {
        assert.is(r.device.name, "zyx");
      });
    });

    await it("should get results only once", async () => {
      const results: ScanResult[] = [];
      if (Capacitor.getPlatform() === "web") {
        // web requires user interaction
        await showAlert("requestLEScan");
      }
      await BleClient.requestLEScan(
        {
          services: [HEART_RATE_SERVICE],
          namePrefix: "zyx",
        },
        () => {
          //
        },
      );
      await BleClient.stopLEScan();
      await BleClient.requestLEScan(
        {
          services: [HEART_RATE_SERVICE],
          namePrefix: "zyx",
        },
        result => {
          results.push(result);
        },
      );
      await sleep(5000);
      if (results.length === 0) {
        await sleep(3000);
      }
      await BleClient.stopLEScan();
      assert.is(results.length, 1);
      assert.is(results[0].device.name, "zyx");
    });
  });
}
