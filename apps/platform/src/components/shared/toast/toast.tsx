import { TOAST_TYPE, type TToastType } from '@blog/config';
import type { ReactNode } from 'react';

import { toastVariants, type TToastVariants } from './toast-variants';

export interface IToastAction {
  label: string;
  onAct: () => void;
  keyHint?: string;
}

export type TToastProps = {
  type: TToastType;
  /** Overlays the type glyph with a spinner for an in-flight `toast.promise` state. */
  isLoading?: boolean;
  message: ReactNode;
  time?: string;
  action?: IToastAction;
  dismissLabel: string;
  onDismiss: () => void;
  phase: NonNullable<TToastVariants['phase']>;
  className?: string;
  dataTestId?: string;
};

const TOAST_GLYPH: Record<TToastType, string> = {
  [TOAST_TYPE.SUCCESS]: '✓',
  [TOAST_TYPE.INFO]: 'i',
  [TOAST_TYPE.WARNING]: '⚠',
  [TOAST_TYPE.ERROR]: '!',
};

const TOAST_ROLE: Record<TToastType, 'status' | 'alert'> = {
  [TOAST_TYPE.SUCCESS]: 'status',
  [TOAST_TYPE.INFO]: 'status',
  [TOAST_TYPE.WARNING]: 'status',
  [TOAST_TYPE.ERROR]: 'alert',
};

/**
 * A single dark, fixed-position notification — controlled and purely
 * presentational, matching the design mock's compact icon + message +
 * dismiss shape. The queue, timers, and phase transitions live in
 * `ToastProvider`, which re-renders this with updated props.
 */
export const Toast = ({
  type,
  isLoading = false,
  message,
  time,
  action,
  dismissLabel,
  onDismiss,
  phase,
  className,
  dataTestId,
}: TToastProps) => {
  const s = toastVariants({ type, phase });

  return (
    <div
      role={TOAST_ROLE[type]}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      {isLoading ? (
        <span className={s.spinner()} aria-hidden="true" />
      ) : (
        <span className={s.glyph()} aria-hidden="true">
          {TOAST_GLYPH[type]}
        </span>
      )}
      <span className={s.message()}>{message}</span>
      {time && <span className={s.time()}>{time}</span>}
      {action && (
        <button type="button" onClick={action.onAct} className={s.action()}>
          {action.label}
          {action.keyHint && (
            <span className={s.actionKey()}>{action.keyHint}</span>
          )}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={dismissLabel}
        title={dismissLabel}
        className={s.dismiss()}
      >
        ×
      </button>
    </div>
  );
};
