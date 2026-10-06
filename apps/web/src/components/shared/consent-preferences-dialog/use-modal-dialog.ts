import { useEffect, useRef, type RefObject } from 'react';

export const useModalDialog = (
  isOpen: boolean,
  fallbackFocusRef: RefObject<HTMLElement | null>,
) => {
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
      fallbackFocusRef.current?.querySelector('button')?.focus();
    };
    dialog.addEventListener('close', restoreFocus);
    return () => dialog.removeEventListener('close', restoreFocus);
  }, [fallbackFocusRef]);

  return dialogRef;
};
