import type { DisplayStrings } from "@capacitor-community/bluetooth-le";
import {
  BleClient,
  dataViewToText,
  numbersToDataView,
  numberToUUID,
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
  GENERIC_SERVICE,
  DEVICE_NAME_CHARACTERISTIC,
  BATTERY_SERVICE,
  BATTERY_CHARACTERISTIC,
} from "../../helpers/ble";
import { handleError } from "../../helpers/error";
import { resultToString, Target } from "../../helpers/helpers";
import { main } from "../../helpers/usage";
import { getVersion } from "../../helpers/version";

@Component({
  tag: "app-home",
})
export class AppHome {
  @State() result = "";
  @State() notification1 = "";
  @State() notification2 = "";
  @State() heartRate: [string, number][] = [];
  @State() version = "";

  async componentDidLoad(): Promise<void> {
    this.version = await getVersion();
  }

  private counter = 0;

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
      label: "get enabled",
      action: async () => {
        const result = await BleClient.getEnabled();
        return result;
      },
    },
    {
      label: "is enabled",
      action: async () => {
        const result = await BleClient.isEnabled();
        return result;
      },
    },
    {
      label: "start enabled notifications",
      action: () => {
        return BleClient.startEnabledNotifications(state =>
          this.showResult(state),
        );
      },
    },
    {
      label: "stop enabled notifications",
      action: () => {
        return BleClient.stopEnabledNotifications();
      },
    },
    {
      label: "set display EN",
      action: () => {
        const displayStrings: DisplayStrings = {
          scanning: "Scanning...",
          cancel: "Cancel",
          availableDevices: "Available devices",
          noDeviceFound: "No device found",
        };
        return BleClient.setDisplayStrings(displayStrings);
      },
    },
    {
      label: "set display DE",
      action: () => {
        const displayStrings: DisplayStrings = {
          scanning: "Am Scannen...",
          cancel: "Abbrechen",
          availableDevices: "Verfügbare Geräte",
          noDeviceFound: "Kein Gerät gefunden",
        };
        return BleClient.setDisplayStrings(displayStrings);
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
          optionalServices: [POLAR_PMD_SERVICE, BATTERY_SERVICE],
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
      action: async () => {
        return BleClient.connect(this.deviceId, () =>
          console.log("disconnected event"),
        );
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
      label: "double read",
      action: async () => {
        const result1 = BleClient.read(
          this.deviceId,
          HEART_RATE_SERVICE,
          BODY_SENSOR_LOCATION_CHARACTERISTIC,
        );
        const result2 = BleClient.read(
          this.deviceId,
          BATTERY_SERVICE,
          BATTERY_CHARACTERISTIC,
        );
        console.log("result1", result1);
        console.log("result2", result2);
        return await result1;
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
      label: "start notifications (fail)",
      action: () => {
        return BleClient.startNotifications(
          this.deviceId,
          HEART_RATE_SERVICE,
          BODY_SENSOR_LOCATION_CHARACTERISTIC,
          value => {
            console.log(value);
          },
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
      label: "start double notifications control/hr",
      action: async () => {
        BleClient.startNotifications(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_CONTROL_POINT,
          value => this.showResult(value, Target.NOTIFICATION_2),
        );
        BleClient.startNotifications(
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
      label: "double write control (get ecg settings)",
      action: async () => {
        BleClient.write(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_CONTROL_POINT,
          numbersToDataView([1, 0]),
        );
        BleClient.write(
          this.deviceId,
          POLAR_PMD_SERVICE,
          POLAR_PMD_CONTROL_POINT,
          numbersToDataView([3, 0]),
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
      label: "request device (HR zyx)",
      action: async () => {
        const device = await BleClient.requestDevice({
          services: [numberToUUID(0x180d)],
          optionalServices: [numberToUUID(0x1111), GENERIC_SERVICE],
        });
        console.log("device name", device.name);
        this.deviceId = device.deviceId;
        return device;
      },
    },
    {
      label: "connect",
      action: async () => {
        await BleClient.connect(this.deviceId, () =>
          console.log("disconnected event"),
        );
      },
    },
    {
      label: "read 12",
      action: () => {
        return BleClient.read(
          this.deviceId,
          numberToUUID(0x1111),
          numberToUUID(0x1112),
        );
      },
    },
    {
      label: "read 13",
      action: () => {
        return BleClient.read(
          this.deviceId,
          numberToUUID(0x1111),
          numberToUUID(0x1113),
        );
      },
    },
    {
      label: "write 13",
      action: () => {
        this.counter++;
        return BleClient.write(
          this.deviceId,
          numberToUUID(0x1111),
          numberToUUID(0x1113),
          numbersToDataView([this.counter]),
        );
      },
    },
    {
      label: "write 12 (fail)",
      action: () => {
        this.counter++;
        return BleClient.write(
          this.deviceId,
          numberToUUID(0x1111),
          numberToUUID(0x1112),
          numbersToDataView([this.counter]),
        );
      },
    },
    {
      label: "write without response 12",
      action: () => {
        this.counter++;
        return BleClient.writeWithoutResponse(
          this.deviceId,
          numberToUUID(0x1111),
          numberToUUID(0x1112),
          numbersToDataView([this.counter]),
        );
      },
    },
    {
      label: "write without response 13 (fail)",
      action: () => {
        this.counter++;
        return BleClient.writeWithoutResponse(
          this.deviceId,
          numberToUUID(0x1111),
          numberToUUID(0x1113),
          numbersToDataView([this.counter]),
        );
      },
    },
    {
      label: "enable queue",
      action: async () => {
        BleClient.enableQueue();
      },
    },
    {
      label: "disable queue",
      action: async () => {
        BleClient.disableQueue();
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
      label: "read performance",
      action: async () => {
        console.time("read performance");
        const characteristics = [0x1115, 0x1116, 0x1117, 0x1118, 0x1119];
        const operations = characteristics.map(c =>
          BleClient.read(this.deviceId, numberToUUID(0x1111), numberToUUID(c)),
        );
        const result = await Promise.all(operations);
        console.timeEnd("read performance");
        return result;
      },
    },
    {
      label: "write performance",
      action: async () => {
        console.time("write performance");
        const characteristics = [0x1115, 0x1116, 0x1117, 0x1118, 0x1119];
        const operations = characteristics.map(c =>
          BleClient.write(
            this.deviceId,
            numberToUUID(0x1111),
            numberToUUID(c),
            numbersToDataView([this.counter]),
          ),
        );
        const result = await Promise.all(operations);
        console.timeEnd("write performance");
        return result;
      },
    },
    {
      label: "write no response performance",
      action: async () => {
        console.time("write no response performance");
        const characteristics = [0x1115, 0x1116, 0x1117, 0x1118, 0x1119];
        const operations = characteristics.map(c =>
          BleClient.writeWithoutResponse(
            this.deviceId,
            numberToUUID(0x1111),
            numberToUUID(c),
            numbersToDataView([this.counter]),
          ),
        );
        const result = await Promise.all(operations);
        console.timeEnd("write no response performance");
        return result;
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
          <div class="ion-margin">@capacitor/core: {this.version}</div>
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
