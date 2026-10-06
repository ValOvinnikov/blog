import { COOKIE_SETTINGS_BUTTON_TEST_ID } from '@web/components/shared/cookie-settings-button';
import { useEffect, useRef } from 'react';

export const useModalDialog = (isOpen: boolean) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) {
      openerRef.current = document.activeElement;
      dialog.showModal();
    }
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const restoreFocus = () => {
      if (openerRef.current?.isConnected) return;
      document
        .querySelector<HTMLElement>(
          `[data-testid="${COOKIE_SETTINGS_BUTTON_TEST_ID}"]`,
        )
        ?.focus();
    };
    dialog.addEventListener('close', restoreFocus);
    return () => dialog.removeEventListener('close', restoreFocus);
  }, []);

  return dialogRef;
};
