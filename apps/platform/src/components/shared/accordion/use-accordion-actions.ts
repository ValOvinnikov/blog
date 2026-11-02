import type { TMaybeNull, TMaybeUndefined } from '@blog/config';
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  type Ref,
} from 'react';

export type TAccordionActions<TValue extends string> = {
  openRow: (value: TValue, options?: { focus?: boolean }) => void;
};

export const useAccordionActions = <TValue extends string>(
  actionsRef: TMaybeUndefined<Ref<TAccordionActions<TValue>>>,
  openValues: readonly TValue[],
  setOpenValues: (values: TValue[]) => void,
) => {
  const buttons = useRef(new Map<string, HTMLElement>());
  const pendingFocus = useRef<TMaybeUndefined<TValue>>(undefined);

  useImperativeHandle(
    actionsRef,
    () => ({
      openRow: (value, { focus = false } = {}) => {
        if (openValues.includes(value)) {
          if (focus) buttons.current.get(value)?.focus();
          return;
        }
        if (focus) pendingFocus.current = value;
        setOpenValues([...openValues, value]);
      },
    }),
    [openValues, setOpenValues],
  );

  useEffect(() => {
    const value = pendingFocus.current;
    if (value === undefined || !openValues.includes(value)) return;
    pendingFocus.current = undefined;
    buttons.current.get(value)?.focus();
  }, [openValues]);

  return useCallback((value: string, button: TMaybeNull<HTMLElement>) => {
    if (button) {
      buttons.current.set(value, button);
    } else {
      buttons.current.delete(value);
    }
  }, []);
};
