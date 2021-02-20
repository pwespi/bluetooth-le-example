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
