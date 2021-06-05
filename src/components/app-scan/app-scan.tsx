import type { BleDevice, ScanResult } from "@capacitor-community/bluetooth-le";
import {
  BleClient,
  dataViewToNumbers,
  ScanMode,
} from "@capacitor-community/bluetooth-le";
import { loadingController } from "@ionic/core";
import { Component, Host, h, State } from "@stencil/core";

import {
  HEART_RATE_SERVICE,
  BODY_SENSOR_LOCATION_CHARACTERISTIC,
} from "../../helpers/ble";
import { handleError } from "../../helpers/error";
import { resultToString } from "../../helpers/helpers";
import { sleep } from "../../helpers/sleep";
import { scan } from "../../helpers/usageScan";

@Component({
  tag: "app-scan",
})
export class AppScan {
  @State() result = "";
  @State() devices: BleDevice[] = [];

  private deviceId = "";

  private actions: { label: string; action: () => Promise<any> }[] = [
    {
      label: "initialize",
      action: () => {
        return BleClient.initialize();
      },
    },
    {
      label: "clear",
      action: async () => {
        this.devices = [];
      },
    },
    {
      label: "scan usage",
      action: async () => {
        await scan();
      },
    },
    {
      label: "request scan",
      action: () => {
        this.devices = [];
        return BleClient.requestLEScan({}, result => {
          this.logScanResult(result);
          this.devices = [...this.devices, result.device];
        });
      },
    },
    {
      label: "request scan HR",
      action: () => {
        this.devices = [];
        return BleClient.requestLEScan(
          {
            services: [HEART_RATE_SERVICE],
          },
          result => {
            this.logScanResult(result);
            this.devices = [...this.devices, result.device];
          },
        );
      },
    },
    {
      label: "request scan HR allowDuplicates",
      action: () => {
        this.devices = [];
        return BleClient.requestLEScan(
          {
            services: [HEART_RATE_SERVICE],
            allowDuplicates: true,
          },
          result => {
            this.logScanResult(result);
            this.devices = [...this.devices, result.device];
          },
        );
      },
    },

    {
      label: "request scan HR allowDuplicates, low latency",
      action: () => {
        this.devices = [];
        return BleClient.requestLEScan(
          {
            services: [HEART_RATE_SERVICE],
            allowDuplicates: true,
            scanMode: ScanMode.SCAN_MODE_LOW_LATENCY,
          },
          result => {
            this.logScanResult(result);
            this.devices = [...this.devices, result.device];
          },
        );
      },
    },
    {
      label: "stop scan",
      action: () => {
        return BleClient.stopLEScan();
      },
    },
    {
      label: "scan cycles",
      action: async () => {
        for (const i of Array.from({ length: 10 }).map((_, i) => i + 1)) {
          console.log(i);
          await BleClient.requestLEScan({}, result =>
            this.logScanResult(result),
          );
          await sleep(2000);
          await BleClient.stopLEScan();
          await sleep(2000);
        }
      },
    },
    {
      label: "connect",
      action: () => {
        return BleClient.connect(this.deviceId);
      },
    },
    {
      label: "read body sensor location",
      action: () => {
        return BleClient.read(
          this.deviceId,
          HEART_RATE_SERVICE,
          BODY_SENSOR_LOCATION_CHARACTERISTIC,
        );
      },
    },
    {
      label: "disconnect",
      action: () => {
        return BleClient.disconnect(this.deviceId);
      },
    },
  ];

  private logScanResult(result: ScanResult) {
    try {
      console.log(
        "result",
        result?.device?.name,
        JSON.stringify(result, null, 2),
      );
      for (const key of Object.keys(result?.manufacturerData ?? {})) {
        console.log(
          "manufacturerData",
          result?.device?.name,
          key,
          result?.manufacturerData?.[key]
            ? dataViewToNumbers(result?.manufacturerData?.[key])
            : null,
        );
      }
      for (const key of Object.keys(result?.serviceData ?? {})) {
        console.log(
          "serviceData",
          result?.device?.name,
          key,
          result?.serviceData?.[key]
            ? dataViewToNumbers(result?.serviceData?.[key])
            : null,
        );
      }
      if (result?.rawAdvertisement) {
        console.log(
          "rawAdvertisement",
          result?.device?.name,
          dataViewToNumbers(result.rawAdvertisement),
        );
      }
    } catch (error) {
      console.error(error);
    }
  }

  private async runAction(action: () => Promise<any>): Promise<void> {
    const loading = await loadingController.create({});
    await loading.present();
    try {
      const result = await action();
      this.result = resultToString(result);
    } catch (error) {
      handleError(error);
    }
    loading.dismiss();
  }

  render(): any {
    return (
      <Host>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Scanner</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="ion-margin">Result: {this.result}</div>

          {this.actions.map(action => (
            <ion-button onClick={() => this.runAction(action.action)}>
              {action.label}
            </ion-button>
          ))}
          <ion-list>
            {this.devices.map(d => (
              <ion-item button onClick={() => (this.deviceId = d.deviceId)}>
                {d.name ?? "Unknown"}
              </ion-item>
            ))}
          </ion-list>
        </ion-content>
      </Host>
    );
  }
}
