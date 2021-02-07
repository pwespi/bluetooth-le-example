import {
  BleClient,
  dataViewToText,
  numberToUUID,
  ScanMode,
} from "@capacitor-community/bluetooth-le";
import { loadingController } from "@ionic/core";
import { Component, h, Host, State } from "@stencil/core";

import {
  BATTERY_CHARACTERISTIC,
  BATTERY_SERVICE,
  DEVICE_INFORMATION_SERVICE,
  DEVICE_NAME_CHARACTERISTIC,
  GENERIC_SERVICE,
  HUMIDITY_CHARACTERISTIC,
  HUMIDITY_SERVICE,
  MANUFACTURER_NAME_CHARACTERISTIC,
  TEMPERATURE_CHARACTERISTIC,
  TEMPERATURE_SERVICE,
} from "../../helpers/ble";
import { handleError } from "../../helpers/error";
import { Target, resultToString } from "../../helpers/helpers";

@Component({
  tag: "app-humigadget",
})
export class AppHumigadget {
  @State() result = "";
  @State() notification1 = "";
  @State() notification2 = "";

  private deviceId = "";

  private actions: { label: string; action: () => Promise<any> }[] = [
    {
      label: "request device",
      action: async () => {
        const result = await BleClient.requestDevice({
          optionalServices: [
            GENERIC_SERVICE,
            DEVICE_INFORMATION_SERVICE,
            BATTERY_SERVICE,
            TEMPERATURE_SERVICE,
            HUMIDITY_SERVICE,
          ],
        });
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "request device (by name)",
      action: async () => {
        const result = await BleClient.requestDevice({
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
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "request device (by name prefix)",
      action: async () => {
        const result = await BleClient.requestDevice({
          namePrefix: "Smart H",
          optionalServices: [
            GENERIC_SERVICE,
            DEVICE_INFORMATION_SERVICE,
            BATTERY_SERVICE,
            TEMPERATURE_SERVICE,
            HUMIDITY_SERVICE,
          ],
          scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
        });
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "request device (filter test and)",
      action: async () => {
        const result = await BleClient.requestDevice({
          services: [numberToUUID(0x1810), numberToUUID(0x1822)],
        });
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "request device (filter test or)",
      action: async () => {
        const result = await BleClient.requestDevice({
          services: [
            numberToUUID(0x1810),
            numberToUUID(0x1822),
            numberToUUID(0x1823),
          ],
        });
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "request device (filter test or with name)",
      action: async () => {
        const result = await BleClient.requestDevice({
          name: "zyx",
          services: [
            numberToUUID(0x1810),
            numberToUUID(0x1822),
            numberToUUID(0x1823),
          ],
        });
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "request device (filter test or with name 2)",
      action: async () => {
        const result = await BleClient.requestDevice({
          name: "zyx2",
          services: [
            numberToUUID(0x1810),
            numberToUUID(0x1822),
            numberToUUID(0x1823),
          ],
        });
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "connect",
      action: async () => {
        return BleClient.connect(this.deviceId, () =>
          console.log("disconnected event"),
        );
      },
    },
    {
      label: "read device name",
      action: async () => {
        const result = await BleClient.read(
          this.deviceId,
          GENERIC_SERVICE,
          DEVICE_NAME_CHARACTERISTIC,
        );
        return dataViewToText(result);
      },
    },
    {
      label: "read manufacturer name",
      action: async () => {
        const result = await BleClient.read(
          this.deviceId,
          DEVICE_INFORMATION_SERVICE,
          MANUFACTURER_NAME_CHARACTERISTIC,
        );
        return dataViewToText(result);
      },
    },
    {
      label: "read battery",
      action: async () => {
        const value = await BleClient.read(
          this.deviceId,
          BATTERY_SERVICE,
          BATTERY_CHARACTERISTIC,
        );
        return value.getUint8(0);
      },
    },
    {
      label: "read temperature",
      action: async () => {
        const value = await BleClient.read(
          this.deviceId,
          TEMPERATURE_SERVICE,
          TEMPERATURE_CHARACTERISTIC,
        );
        return value.getFloat32(0, true);
      },
    },
    {
      label: "read humidity",
      action: async () => {
        const value = await BleClient.read(
          this.deviceId,
          HUMIDITY_SERVICE,
          HUMIDITY_CHARACTERISTIC,
        );
        return value.getFloat32(0, true);
      },
    },
    {
      label: "disconnect",
      action: async () => {
        console.log("start disconnecting");
        await BleClient.disconnect(this.deviceId);
        console.log("disconnected");
      },
    },
  ];

  private async runAction(action: () => Promise<any>): Promise<void> {
    const loading = await loadingController.create({});
    await loading.present();
    try {
      const result = await action();
      this.showResult(result);
    } catch (error) {
      handleError(error);
    }
    loading.dismiss();
  }

  private showResult(result: any, target: Target = Target.RESULT): void {
    console.log(result);
    const resultString = resultToString(result);
    if (target === Target.RESULT) {
      this.result = resultString;
    } else if (target === Target.NOTIFICATION_1) {
      this.notification1 = resultString;
    } else if (target === Target.NOTIFICATION_2) {
      this.notification2 = resultString;
    }
  }

  render(): any {
    return (
      <Host>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Humigadget</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="ion-margin">Result: {this.result}</div>
          <div class="ion-margin">Notification1: {this.notification1}</div>
          <div class="ion-margin">Notification2: {this.notification2}</div>

          {this.actions.map(action => (
            <ion-button onClick={() => this.runAction(action.action)}>
              {action.label}
            </ion-button>
          ))}
        </ion-content>
      </Host>
    );
  }
}
