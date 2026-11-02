import { KEY } from '@platform/constants/keyboard';
import type { KeyboardEvent } from 'react';

export const focusToolbarEdge = (event: KeyboardEvent<HTMLElement>) => {
  const isHome = event.key === KEY.HOME;
  if (!isHome && event.key !== KEY.END) {
    return;
  }
  const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>(
    'button:not(:disabled)',
  );
  event.preventDefault();
  buttons[isHome ? 0 : buttons.length - 1]?.focus();
};
