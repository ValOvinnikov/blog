import { FOCUSABLE_SELECTOR } from '@platform/constants/focusable';
import { useRef } from 'react';

export const useAlertDialogInitialFocus = () => {
  const actionsRef = useRef<HTMLDivElement>(null);

  const initialFocus = () => {
    const actions = actionsRef.current;
    const popup = actions?.parentElement;
    if (!actions || !popup) return true;

    const bodyControl = Array.from(
      popup.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
    ).find((element) => !actions.contains(element));
    const lastAction = actions.lastElementChild;

    return (
      bodyControl ?? (lastAction instanceof HTMLElement ? lastAction : true)
    );
  };

  return { actionsRef, initialFocus };
};
