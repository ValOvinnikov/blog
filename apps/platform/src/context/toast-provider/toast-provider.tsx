'use client';

import { TOAST_TYPE } from '@blog/config';
import type {
  IToastPayload,
  IToastRecord,
} from '@platform/components/shared/toast';
import { ToastViewport } from '@platform/components/shared/toast-viewport';
import { useTranslations } from 'next-intl';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { ToastRow } from './components/toast-row/toast-row';
import { createToastStore, type IToastPromiseMessages } from './toast-store';

interface IUseToast {
  success: (payload: IToastPayload) => string;
  info: (payload: IToastPayload) => string;
  warning: (payload: IToastPayload) => string;
  error: (payload: IToastPayload) => string;
  promise: <T>(
    promise: Promise<T>,
    messages: IToastPromiseMessages<T>,
  ) => Promise<T>;
  dismiss: (id?: string) => void;
}

const ToastContext = createContext<IUseToast | undefined>(undefined);

type TToastProviderProps = {
  children: ReactNode;
};

const withDismissingAction = (
  record: IToastRecord,
  dismiss: (id: string) => void,
): IToastRecord => {
  const { id, action } = record;
  if (!action) return record;

  return {
    ...record,
    action: {
      ...action,
      onAct: () => {
        action.onAct();
        dismiss(id);
      },
    },
  };
};

export const ToastProvider = ({ children }: TToastProviderProps) => {
  // A lazy useState initialiser, not a ref, so the store is safe to read during render.
  const [store] = useState(() => createToastStore());
  const t = useTranslations('toastProvider');

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getServerState,
  );
  const hasVisibleToasts = state.visible.length > 0;

  useEffect(() => () => store.destroy(), [store]);

  const toast = useMemo<IUseToast>(
    () => ({
      success: (payload) => store.actions.show(TOAST_TYPE.SUCCESS, payload),
      info: (payload) => store.actions.show(TOAST_TYPE.INFO, payload),
      warning: (payload) => store.actions.show(TOAST_TYPE.WARNING, payload),
      error: (payload) => store.actions.show(TOAST_TYPE.ERROR, payload),
      promise: store.actions.promise,
      dismiss: store.actions.dismiss,
    }),
    [store],
  );

  useEffect(() => {
    if (!hasVisibleToasts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') store.actions.dismiss();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasVisibleToasts, store]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport
        ariaLabel={t('viewportAriaLabel')}
        dataTestId="toast-viewport"
      >
        {state.visible.map((record) => (
          <ToastRow
            key={record.id}
            record={withDismissingAction(record, store.actions.dismiss)}
            onEntered={store.actions.markEntered}
            onPause={store.actions.pause}
            onResume={store.actions.resume}
            onDismiss={store.actions.dismiss}
          />
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
};

export const useToast = (): IUseToast => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
