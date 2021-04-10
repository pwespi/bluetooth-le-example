import { BleClient } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import * as assert from "uvu/assert";

import { assertThrows } from "./assertThrows";
import { describe, it } from "./testRunner";

export async function testInit(): Promise<void> {
  await describe("BleClient initialize", async () => {
    await it("should throw an error if not initialized on android or ios", async () => {
      if (Capacitor.getPlatform() !== "web") {
        const test = async () => {
          await BleClient.connect("");
        };
        await assertThrows(test, "not initialized");
      }
      assert.is.not(BleClient, undefined);
    });

    await it("should initialize", async () => {
      await BleClient.initialize();
      assert.is.not(BleClient, undefined);
    });
  });
}
