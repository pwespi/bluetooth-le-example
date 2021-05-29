import { alertController, loadingController } from "@ionic/core";

/**
 * Some Bluetooth Web APIs need user interaction
 * @param message
 */
export async function showAlert(message: string): Promise<void> {
  const loading = await loadingController.getTop();
  await loading?.dismiss();
  const alert = await alertController.create({
    message,
    buttons: ["OK"],
  });
  await alert.present();
  await alert.onDidDismiss();
}

export async function confirmAlert(message?: string): Promise<boolean> {
  let confirm = false;

  const alert = await alertController.create({
    header: "Confirm",
    message,
    buttons: [
      {
        text: "No",
        role: "cancel",
        cssClass: "secondary",
      },
      {
        text: "Yes",
        handler: () => {
          confirm = true;
        },
      },
    ],
  });

  await alert.present();
  await alert.onDidDismiss();

  return confirm;
}
