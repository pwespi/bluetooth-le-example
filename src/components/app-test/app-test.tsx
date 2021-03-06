import { loadingController } from "@ionic/core";
import { Component, Host, h, State } from "@stencil/core";

import { handleError } from "../../helpers/error";
import { resultToString } from "../../helpers/helpers";
import { testBleClient } from "../../test/bleClient.test";
import { testBleScan } from "../../test/bleScan.test";
import { testBond } from "../../test/bond.test";
import { testConnection } from "../../test/connection.test";
import { testDisplayStrings } from "../../test/displayStrings.test";
import { testEnabled } from "../../test/enabled.test";
import { testFilters } from "../../test/filter.test";
import { testInit } from "../../test/initialize.test";
import { testMultipleDevices } from "../../test/multipleDevices.test";
import { testNotificationCleanup } from "../../test/notificationCleanup.test";
import { testRunner } from "../../test/runner.test";
import { printResult, initializeTest } from "../../test/testRunner";
import { testWrite } from "../../test/write.test";

@Component({
  tag: "app-test",
  styleUrl: "app-test.css",
})
export class AppTest {
  @State() result = "";

  private actions: { label: string; action: () => Promise<any> }[] = [
    {
      label: "test all",
      action: async () => {
        initializeTest();
        await testInit();
        await testBleClient();
        await testEnabled();
        await testWrite();
        await testMultipleDevices();
        await testNotificationCleanup();
        await testConnection();
        await testBond();
        await testBleScan();
        await testFilters();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test init",
      action: async () => {
        initializeTest();
        await testInit();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test ble client",
      action: async () => {
        initializeTest();
        await testBleClient();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test display strings",
      action: async () => {
        initializeTest();
        await testDisplayStrings();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test enabled",
      action: async () => {
        initializeTest();
        await testEnabled();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test write",
      action: async () => {
        initializeTest();
        await testWrite();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test multiple dev",
      action: async () => {
        initializeTest();
        await testMultipleDevices();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test notification cleanup",
      action: async () => {
        initializeTest();
        await testNotificationCleanup();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test connection",
      action: async () => {
        initializeTest();
        await testConnection();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test bond",
      action: async () => {
        initializeTest();
        await testBond();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test scan",
      action: async () => {
        initializeTest();
        await testBleScan();
        const result = printResult();
        return result;
      },
    },
    {
      label: "test filters",
      action: async () => {
        initializeTest();
        await testFilters();
        const result = printResult();
        return result;
      },
    },
    {
      label: "(test runner)",
      action: async () => {
        initializeTest();
        await testRunner();
        const result = printResult();
        return result;
      },
    },
  ];

  private async runAction(action: () => Promise<any>): Promise<void> {
    const loading = await loadingController.create({});
    await loading.present();
    try {
      this.result = "";
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
            <ion-title>Test</ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content class="ion-padding">
          <div class="ion-margin result">{this.result}</div>
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
