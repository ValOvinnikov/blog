'use client';

import { TOAST_TYPE } from '@blog/config';
import { Toast } from '@blog/ui/components/molecules/toast';
import { ToastViewport } from '@blog/ui/components/organisms/toast-viewport';
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
import {
  createToastStore,
  type IToastPayload,
  type IToastPromiseMessages,
} from './toast-store';
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

/**
 * Subscribed via `useSyncExternalStore`, so this renders an always-empty
 * queue on the server and never ships a toast in the static HTML.
 *
 * @example
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 */
export const ToastProvider = ({ children }: IToastProviderProps) => {
  // Lazy `useState` initializer (not `useRef`) — a stable, once-per-mount
  // store instance that's safe to read during render, unlike a ref.
  const [store] = useState(() => createToastStore());
  const t = useTranslations('toastProvider');

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

  // Double-rAF before flipping `entering` -> `visible` so the browser paints
  // the off-screen start state first (no first-frame jump) — a rendering
  // concern the store itself stays free of.
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

  useEffect(() => {
    if (state.visible.length === 0) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      const focusedId = rowPause.getFocusedRowId(document.activeElement);
      store.actions.dismiss(focusedId);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.visible.length, store, rowPause]);

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
                event.relatedTarget as Node | null,
              )
            }
          >
            <Toast
              type={record.type}
              isLoading={record.isLoading}
              title={record.title}
              message={
                record.count && record.count > 1
                  ? `${record.message}${t('mergeCountSuffix', { count: record.count })}`
                  : record.message
              }
              time={record.time}
              action={
                record.action && {
                  label: record.action.label,
                  keyHint: record.action.keyHint,
                  onAct: () => {
                    record.action?.onAct();
                    store.actions.dismiss(record.id);
                  },
                }
              }
              dismissLabel={t('dismissLabel')}
              isPaused={record.paused}
              durationMs={record.durationMs}
              onDismiss={() => store.actions.dismiss(record.id)}
              phase={record.phase}
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
