'use client';

import type { TMaybeUndefined } from '@blog/config';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';

type TStop = { id: string; resetKey: string };

type TToolbarTabStop = {
  stopId: TMaybeUndefined<string>;
  resetKey: string;
  setStop: Dispatch<SetStateAction<TMaybeUndefined<TStop>>>;
};

const ToolbarTabStopContext =
  createContext<TMaybeUndefined<TToolbarTabStop>>(undefined);

type TToolbarTabStopProviderProps = {
  defaultStopId: TMaybeUndefined<string>;
  resetKey: string;
  children: ReactNode;
};

export const getToolbarStopId = (groupLabel: string, value: string) =>
  `${groupLabel}:${value}`;

export const ToolbarTabStopProvider = ({
  defaultStopId,
  resetKey,
  children,
}: TToolbarTabStopProviderProps) => {
  const [stop, setStop] = useState<TMaybeUndefined<TStop>>();
  const rememberedId = stop?.resetKey === resetKey ? stop.id : undefined;
  const stopId = rememberedId ?? defaultStopId;
  const value = useMemo(
    () => ({ stopId, resetKey, setStop }),
    [stopId, resetKey],
  );

  return (
    <ToolbarTabStopContext.Provider value={value}>
      {children}
    </ToolbarTabStopContext.Provider>
  );
};

export const useToolbarTabStop = (id: string) => {
  const context = useContext(ToolbarTabStopContext);
  const setStop = context?.setStop;

  useEffect(() => {
    if (!setStop) {
      return undefined;
    }
    return () =>
      setStop((current) => (current?.id === id ? undefined : current));
  }, [setStop, id]);

  if (!context) {
    return undefined;
  }

  const { stopId, resetKey } = context;
  const onFocus = () => context.setStop({ id, resetKey });

  return stopId === undefined
    ? { onFocus }
    : { onFocus, tabIndex: stopId === id ? 0 : -1 };
};
