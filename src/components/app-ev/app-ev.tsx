import { BleClient } from "@capacitor-community/bluetooth-le";
import { loadingController } from "@ionic/core";
import { Component, Host, h, State } from "@stencil/core";

import { EV_NOTIFY_CHAR, EV_SERVICE } from "../../helpers/ble";
import { handleError } from "../../helpers/error";
import { resultToString, Target } from "../../helpers/helpers";

@Component({
  tag: "app-ev",
})
export class AppEv {
  @State() result = "";
  @State() notification1 = "";

  private deviceId = "E4:EE:63:7C:34:5C";

  private actions: { label: string; action: () => Promise<any> }[] = [
    {
      label: "initialize",
      action: () => {
        return BleClient.initialize();
      },
    },
    {
      label: "request device (EV)",
      action: async () => {
        const result = await BleClient.requestDevice({
          optionalServices: [EV_SERVICE],
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
      label: "create bond",
      action: async () => {
        return BleClient.createBond(this.deviceId);
      },
    },
    {
      label: "is bonded",
      action: async () => {
        const isBonded = await BleClient.isBonded(this.deviceId);
        return isBonded;
      },
    },
    {
      label: "start notifications control",
      action: () => {
        return BleClient.startNotifications(
          this.deviceId,
          EV_SERVICE,
          EV_NOTIFY_CHAR,
          value => this.showResult(value, Target.NOTIFICATION_1),
        );
      },
    },
    {
      label: "stop notifications control",
      action: () => {
        return BleClient.stopNotifications(
          this.deviceId,
          EV_SERVICE,
          EV_NOTIFY_CHAR,
        );
      },
    },
    {
      label: "disconnect",
      action: async () => {
        await BleClient.disconnect(this.deviceId);
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
    }
  }

  render(): any {
    return (
      <Host>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title>EV</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="ion-margin">Result: {this.result}</div>
          <div class="ion-margin">Notification1: {this.notification1}</div>

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
