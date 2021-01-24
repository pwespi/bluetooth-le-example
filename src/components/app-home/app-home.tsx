import {
  BleClient,
  numbersToDataView,
} from "@capacitor-community/bluetooth-le";
import { loadingController } from "@ionic/core";
import { Component, h, Host, State } from "@stencil/core";

import {
  HEART_RATE_SERVICE,
  POLAR_PMD_SERVICE,
  DEVICE_ID,
  BODY_SENSOR_LOCATION_CHARACTERISTIC,
  HEART_RATE_MEASUREMENT_CHARACTERISTIC,
  POLAR_PMD_CONTROL_POINT,
  POLAR_PMD_DATA,
} from "../../helpers/ble";
import { handleError } from "../../helpers/error";
import { resultToString, Target } from "../../helpers/helpers";
import { main } from "../../helpers/usage";

@Component({
  tag: "app-home",
})
export class AppHome {
  @State() result = "";
  @State() notification1 = "";
  @State() notification2 = "";
  @State() heartRate: [string, number][] = [];

  private deviceId = "";

  private actions: { label: string; action: () => Promise<any> }[] = [
    {
      label: "initialize",
      action: () => {
        return BleClient.initialize();
      },
    },
    {
      label: "run usage",
      action: () => {
        return main();
      },
    },
    {
      label: "request device (all)",
      action: async () => {
        const result = await BleClient.requestDevice();
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "request device (HR)",
      action: async () => {
        const result = await BleClient.requestDevice({
          services: [HEART_RATE_SERVICE],
          optionalServices: [POLAR_PMD_SERVICE],
        });
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "request device (fail)",
      action: async () => {
        const result = await BleClient.requestDevice({
          services: ["0000"],
        });
        this.deviceId = result.deviceId;
        return result;
      },
    },
    {
      label: "connect",
      action: () => {
        return BleClient.connect(this.deviceId);
      },
    },
    {
      label: "connect directly",
      action: async () => {
        const result = await BleClient.connect(DEVICE_ID);
        this.deviceId = DEVICE_ID;
        return result;
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
      label: "read (fail)",
      action: () => {
        return BleClient.read(this.deviceId, HEART_RATE_SERVICE, "0000");
      },
    },
    {
      label: "read HR (fail)",
      action: () => {
        return BleClient.read(
          this.deviceId,
          HEART_RATE_SERVICE,
          HEART_RATE_MEASUREMENT_CHARACTERISTIC,
        );
      },
    },
    {
      label: "start notifications HR",
      action: () => {
        this.heartRate = [];
        return BleClient.startNotifications(
          this.deviceId,
          HEART_RATE_SERVICE,
          HEART_RATE_MEASUREMENT_CHARACTERISTIC,
          value => {
            const timestamp = new Date().toLocaleTimeString();
            this.heartRate.push([timestamp, this.parseHeartRate(value)]);
            console.log(timestamp);
            this.showResult(value, Target.NOTIFICATION_1);
          },
        );
      },
    },
    {
      label: "stop notifications HR",
      action: () => {
        return BleClient.stopNotifications(
          this.deviceId,
          HEART_RATE_SERVICE,
          HEART_RATE_MEASUREMENT_CHARACTERISTIC,
        );
      },
    },
    {
      label: "start notifications control",
      action: () => {
        return BleClient.startNotifications(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_CONTROL_POINT,
          value => this.showResult(value, Target.NOTIFICATION_2),
        );
      },
    },
    {
      label: "stop notifications control",
      action: () => {
        return BleClient.stopNotifications(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_CONTROL_POINT,
        );
      },
    },
    {
      label: "write control (get ecg settings)",
      action: () => {
        return BleClient.write(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_CONTROL_POINT,
          numbersToDataView([1, 0]),
        );
      },
    },
    {
      label: "write control (start stream)",
      action: () => {
        return BleClient.write(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_CONTROL_POINT,
          numbersToDataView([2, 0, 0, 1, 130, 0, 1, 1, 14, 0]),
        );
      },
    },
    {
      label: "write control (stop stream)",
      action: () => {
        return BleClient.write(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_CONTROL_POINT,
          numbersToDataView([3, 0]),
        );
      },
    },
    {
      label: "read control",
      action: () => {
        return BleClient.read(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_CONTROL_POINT,
        );
      },
    },
    {
      label: "start notifications data",
      action: () => {
        return BleClient.startNotifications(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_DATA,
          value => this.showResult(value, Target.NOTIFICATION_1),
        );
      },
    },
    {
      label: "stop notifications data",
      action: () => {
        return BleClient.stopNotifications(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_DATA,
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

  private async runAction(action: () => Promise<any>): Promise<void> {
    const loading = await loadingController.create({});
    await loading.present();
    try {
      const result = await action();
      this.showResult(result);
    } catch (error) {
      handleError(error);
    }
    loading?.dismiss();
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

  private parseHeartRate(value: DataView): number {
    const flags = value.getUint8(0);
    const rate16Bits = flags & 0x1;
    let heartRate: number;
    if (rate16Bits > 0) {
      heartRate = value.getUint16(1, true);
    } else {
      heartRate = value.getUint8(1);
    }
    return heartRate;
  }

  render(): any {
    return (
      <Host>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>Heart Rate Monitor</ion-title>
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
          {this.heartRate.map(hr => (
            <div>
              {hr[0]}: {hr[1]}
            </div>
          ))}
        </ion-content>
      </Host>
    );
  }
}
