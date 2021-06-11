/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { BleDevice } from "@capacitor-community/bluetooth-le";
import {
  numberToUUID,
  BleClient,
  numbersToDataView,
} from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import * as assert from "uvu/assert";

import { showAlert } from "../helpers/showAlert";
import { assertThrows } from "./assertThrows";

import { describe, it } from "./testRunner";

export async function testWrite(): Promise<void> {
  await describe("BleClient write", async () => {
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
        namePrefix: "zyx",
        optionalServices: [numberToUUID(0x1111)],
      });
      deviceId = device.deviceId;
      assert.is.not(device, null);
      assert.is(device.name?.includes("zyx"), true);
      assert.ok(deviceId.length > 0);
    });

    await it("should connect", async () => {
      await BleClient.connect(deviceId);
      assert.ok(device);
    });

    await it("should write to test characteristic without response", async () => {
      const before = await BleClient.read(
        deviceId,
        numberToUUID(0x1111),
        numberToUUID(0x1112),
      );
      assert.is(before.getUint8(0), 0);
      await BleClient.writeWithoutResponse(
        deviceId,
        numberToUUID(0x1111),
        numberToUUID(0x1112),
        numbersToDataView([5]),
      );
      const after = await BleClient.read(
        deviceId,
        numberToUUID(0x1111),
        numberToUUID(0x1112),
      );
      assert.is(after.getUint8(0), 5);
    });

    await it("should write to test characteristic (default)", async () => {
      const before = await BleClient.read(
        deviceId,
        numberToUUID(0x1111),
        numberToUUID(0x1113),
      );
      assert.is(before.getUint8(0), 0);
      await BleClient.write(
        deviceId,
        numberToUUID(0x1111),
        numberToUUID(0x1113),
        numbersToDataView([5]),
      );
      const after = await BleClient.read(
        deviceId,
        numberToUUID(0x1111),
        numberToUUID(0x1113),
      );
      assert.is(after.getUint8(0), 5);
    });

    await it("should reject when writing an ArrayBuffer instead of a DataView", async () => {
      await assertThrows(async () => {
        await BleClient.write(
          deviceId,
          numberToUUID(0x1111),
          numberToUUID(0x1113),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          numbersToDataView([0]).buffer,
        );
      });
      await assertThrows(async () => {
        await BleClient.writeWithoutResponse(
          deviceId,
          numberToUUID(0x1111),
          numberToUUID(0x1112),
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          numbersToDataView([0]).buffer,
        );
      });
    });

    await it("should disconnect", async () => {
      await BleClient.disconnect(deviceId);
      assert.ok(true);
    });
  });
}
