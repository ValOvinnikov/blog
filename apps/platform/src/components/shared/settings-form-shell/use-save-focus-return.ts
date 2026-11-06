import type { TMaybeNull } from '@blog/config';
import { type FocusEvent, useRef } from 'react';

const findControl = (control: TMaybeNull<HTMLElement>) => {
  if (!control || control.isConnected) return control;
  return control.id ? document.getElementById(control.id) : null;
};

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
    const target = findControl(lastControlRef.current) ?? titleRef.current;
    target?.focus({ preventScroll: true });
  };

  return { titleRef, saveBarRef, rememberControl, returnFocus };
};
