import { BleClient } from "@capacitor-community/bluetooth-le";
import { Capacitor } from "@capacitor/core";
import * as assert from "uvu/assert";

import { showAlert } from "../helpers/showAlert";

import { describe, it } from "./testRunner";

export async function testEnabled(): Promise<void> {
  if (Capacitor.getPlatform() !== "web") {
    await describe("Bluetooth state", async () => {
      await showAlert("Make sure Bluetooth is on");
      let state: boolean;

      await it("should return true when enabled", async () => {
        state = await BleClient.isEnabled();
        assert.is(state, true);
      });

      await it("should listen when state changes to false", async () => {
        await BleClient.startEnabledNotifications(value => {
          console.log("state", state);
          state = value;
        });
        assert.is(state, true);

        await showAlert("Turn off Bluetooth");
        assert.is(state, false);
      });

      await it("should return false when disabled", async () => {
        state = await BleClient.isEnabled();
        assert.is(state, false);
      });

      await it("should listen when state changes to true", async () => {
        assert.is(state, false);
        await showAlert("Turn on Bluetooth");
        assert.is(state, true);
      });

      await it("should stop listening to state change", async () => {
        assert.is(state, true);
        await BleClient.stopEnabledNotifications();
        await showAlert("Turn off Bluetooth");
        assert.is(state, true);
        state = await BleClient.isEnabled();
        assert.is(state, false);
      });

      await it("should turn on again", async () => {
        await showAlert("Turn on Bluetooth");
        state = await BleClient.isEnabled();
        assert.is(state, true);
      });
    });
  } else {
    await describe("Bluetooth state", async () => {
      await it("should report true on web", async () => {
        const state = await BleClient.isEnabled();
        assert.is(state, true);
      });

      await it("should not throw on startStateNotification", async () => {
        await BleClient.startEnabledNotifications(value => {
          console.log(value);
        });
        assert.ok(true);
      });

      await it("should not throw on stopStateNotification", async () => {
        await BleClient.stopEnabledNotifications();
        assert.ok(true);
      });
    });
  }
}
