import { BleClient } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";

import { assert, describe, it, showAlert } from "./testRunner";

export async function testEnabled(): Promise<void> {
  if (Capacitor.getPlatform() !== "web") {
    await describe("Bluetooth state", async () => {
      await showAlert("Make sure Bluetooth is on");
      let state: boolean;

      await it("should return true when enabled", async () => {
        state = await BleClient.getEnabled();
        assert(state === true);
      });

      await it("should listen when state changes to false", async () => {
        await BleClient.startEnabledNotifications(value => {
          console.log("state", state);
          state = value;
        });
        assert(state === true);

        await showAlert("Turn off Bluetooth");
        assert(state === false);
      });

      await it("should return false when disabled", async () => {
        state = await BleClient.getEnabled();
        assert(state === false);
      });

      await it("should listen when state changes to true", async () => {
        assert(state === false);
        await showAlert("Turn on Bluetooth");
        assert(state === true);
      });

      await it("should stop listening to state change", async () => {
        assert(state === true);
        await BleClient.stopEnabledNotifications();
        await showAlert("Turn off Bluetooth");
        assert(state === true);
        state = await BleClient.getEnabled();
        assert(state === false);
      });

      await it("should turn on again", async () => {
        await showAlert("Turn on Bluetooth");
        state = await BleClient.getEnabled();
        assert(state === true);
      });
    });
  } else {
    await describe("Bluetooth state", async () => {
      await it("should report true on web", async () => {
        const state = await BleClient.getEnabled();
        assert(state === true);
      });

      await it("should not throw on startStateNotification", async () => {
        await BleClient.startEnabledNotifications(getEnabled => {
          console.log(getEnabled);
        });
        assert(true);
      });

      await it("should not throw on stopStateNotification", async () => {
        await BleClient.stopEnabledNotifications();
        assert(true);
      });
    });
  }
}
