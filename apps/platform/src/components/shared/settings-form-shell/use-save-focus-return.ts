import type { TMaybeNull } from '@blog/config';
import { type FocusEvent, useRef } from 'react';

export const useSaveFocusReturn = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const saveBarRef = useRef<HTMLDivElement>(null);
  const lastControlRef = useRef<TMaybeNull<HTMLElement>>(null);

  const rememberControl = ({ target }: FocusEvent) => {
    if (!(target instanceof HTMLElement)) return;
    if (saveBarRef.current?.contains(target)) return;
    lastControlRef.current = target;
  };

  const returnFocus = () => {
    const control = lastControlRef.current;
    const target = control?.isConnected ? control : titleRef.current;
    target?.focus({ preventScroll: true });
  };

  return { titleRef, saveBarRef, rememberControl, returnFocus };
};
