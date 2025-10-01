import { isIOS, Application } from '@nativescript/core';

export interface CustomConfirmOptions {
  title: string;
  message: string;
  okButtonText?: string;
  cancelButtonText?: string;
  okButtonColor?: string; // Hex color like '#EF4444' for red
}

export function showCustomConfirm(
  options: CustomConfirmOptions,
): Promise<boolean> {
  return new Promise((resolve) => {
    if (isIOS) {
      const alertController =
        UIAlertController.alertControllerWithTitleMessagePreferredStyle(
          options.title,
          options.message,
          1, // UIAlertControllerStyle.Alert
        );

      // Cancel action
      const cancelAction = UIAlertAction.actionWithTitleStyleHandler(
        options.cancelButtonText || 'Abbrechen',
        0, // UIAlertActionStyle.Default
        () => {
          resolve(false);
        },
      );

      // OK/Destructive action (red button)
      const okAction = UIAlertAction.actionWithTitleStyleHandler(
        options.okButtonText || 'OK',
        2, // UIAlertActionStyle.Destructive - This makes it red on iOS
        () => {
          resolve(true);
        },
      );

      // Optionally customize the OK button color using KVC
      if (options.okButtonColor) {
        try {
          const color = hexToUIColor(options.okButtonColor);
          (okAction as any).setValueForKey(color, 'titleTextColor');
        } catch (e) {
          console.log('Could not set custom color:', e);
        }
      }

      alertController.addAction(cancelAction);
      alertController.addAction(okAction);

      // Present the alert
      const rootController =
        UIApplication.sharedApplication.keyWindow.rootViewController;
      if (rootController) {
        rootController.presentViewControllerAnimatedCompletion(
          alertController,
          true,
          () => {},
        );
      }
    } else {
      // Android - use standard confirm dialog
      // Note: Android's AlertDialog color customization is more complex
      // For now, fall back to default behavior
      const context =
        Application.android.foregroundActivity ||
        Application.android.startActivity;
      const alertDialog = new android.app.AlertDialog.Builder(context);

      alertDialog.setTitle(options.title);
      alertDialog.setMessage(options.message);

      alertDialog.setPositiveButton(
        options.okButtonText || 'OK',
        new android.content.DialogInterface.OnClickListener({
          onClick: () => {
            resolve(true);
          },
        }),
      );

      alertDialog.setNegativeButton(
        options.cancelButtonText || 'Abbrechen',
        new android.content.DialogInterface.OnClickListener({
          onClick: () => {
            resolve(false);
          },
        }),
      );

      const dialog = alertDialog.create();
      dialog.show();

      // Customize button color on Android if specified
      if (options.okButtonColor) {
        const button = dialog.getButton(
          android.content.DialogInterface.BUTTON_POSITIVE,
        );
        if (button) {
          const color = hexToAndroidColor(options.okButtonColor);
          button.setTextColor(color);
        }
      }
    }
  });
}

function hexToUIColor(hex: string): any {
  // Remove # if present
  hex = hex.replace('#', '');

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  return UIColor.alloc().initWithRedGreenBlueAlpha(r, g, b, 1.0);
}

function hexToAndroidColor(hex: string): number {
  // Remove # if present
  hex = hex.replace('#', '');

  // Add alpha if not present (FF = fully opaque)
  if (hex.length === 6) {
    hex = 'FF' + hex;
  }

  return parseInt(hex, 16);
}
