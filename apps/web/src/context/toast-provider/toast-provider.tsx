'use client';

import { TOAST_TYPE, type TMaybeNull } from '@blog/config';
import { Toast } from '@blog/ui/components/molecules/toast';
import { ToastViewport } from '@blog/ui/components/organisms/toast-viewport';
import { hasLength } from '@blog/utils/primitives';
import { useBusyStyle } from '@web/context/busy-style-provider';
import { useTranslations } from 'next-intl';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import { toastProviderVariants } from './toast-provider-variants';
import type { IToastPayload } from './toast-record';
import { createToastStore, type IToastPromiseMessages } from './toast-store';
import { useToastRowPause } from './use-toast-row-pause';

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

export interface IToastProviderProps {
  children: ReactNode;
}

const s = toastProviderVariants();

export const ToastProvider = ({ children }: IToastProviderProps) => {
  const [store] = useState(() => createToastStore());
  const t = useTranslations('toastProvider');
  const { spinnerVariant } = useBusyStyle();

  const state = useSyncExternalStore(
    store.subscribe,
    store.getState,
    store.getServerState,
  );

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

  const rowPause = useToastRowPause(store.actions.pause, store.actions.resume);
  const scheduledEnterIds = useRef(new Set<string>());

  // Double rAF: the browser must paint the off-screen start state before `visible`, or the first frame jumps.
  useEffect(() => {
    const currentIds = new Set(state.visible.map((record) => record.id));

    for (const id of scheduledEnterIds.current) {
      if (!currentIds.has(id)) scheduledEnterIds.current.delete(id);
    }

    for (const record of state.visible) {
      if (
        record.phase !== 'entering' ||
        scheduledEnterIds.current.has(record.id)
      ) {
        continue;
      }

      scheduledEnterIds.current.add(record.id);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          store.actions.markEntered(record.id);
          scheduledEnterIds.current.delete(record.id);
        });
      });
    }
  }, [state.visible, store]);

  const hasToasts = hasLength(state.visible);

  useEffect(() => {
    if (!hasToasts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      const focusedId = rowPause.getFocusedRowId(document.activeElement);
      store.actions.dismiss(focusedId);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasToasts, store, rowPause]);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastViewport
        ariaLabel={t('viewportAriaLabel')}
        dataTestId="toast-viewport"
      >
        {state.visible.map((record) => (
          <div
            key={record.id}
            ref={rowPause.registerRow(record.id)}
            className={s.row()}
            onMouseEnter={() => rowPause.handleMouseEnter(record.id)}
            onMouseLeave={() => rowPause.handleMouseLeave(record.id)}
            onFocus={() => rowPause.handleFocus(record.id)}
            onBlur={(event) =>
              rowPause.handleBlur(
                record.id,
                event.currentTarget,
                event.relatedTarget as TMaybeNull<Node>,
              )
            }
          >
            <Toast
              toast={{
                ...record,
                message:
                  record.count && record.count > 1
                    ? `${record.message}${t('mergeCountSuffix', { count: record.count })}`
                    : record.message,
                action: record.action && {
                  ...record.action,
                  onAct: () => {
                    record.action?.onAct();
                    store.actions.dismiss(record.id);
                  },
                },
              }}
              spinnerVariant={spinnerVariant}
              dismissLabel={t('dismissLabel')}
              onDismiss={() => store.actions.dismiss(record.id)}
              dataTestId={`toast-${record.id}`}
            />
          </div>
        ))}
      </ToastViewport>
    </ToastContext.Provider>
  );
};

/** Reads the imperative toast API — throws outside a `ToastProvider`. */
export const useToast = (): IUseToast => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
