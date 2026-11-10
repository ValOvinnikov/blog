import {
  ICONS,
  SIZE,
  TOAST_TYPE,
  type IWithClassName,
  type IWithDataTestId,
  type TIconName,
  type TToastType,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import { Spinner, type TSpinnerProps } from '@blog/ui/components/atoms/spinner';
import { isUndefined } from '@blog/utils/primitives';
import type { CSSProperties, ReactNode } from 'react';

import { toastVariants, type TToastVariants } from './toast-variants';

export interface IToastAction {
  label: string;
  onAct: () => void;
  keyHint?: string;
}

export type TToastPhase = NonNullable<TToastVariants['phase']>;

export interface IToast {
  type: TToastType;
  isLoading?: boolean;
  title?: ReactNode;
  message: ReactNode;
  time?: string;
  action?: IToastAction;
  paused?: boolean;
  durationMs?: number;
  phase: TToastPhase;
}

export type TToastProps = IWithClassName &
  IWithDataTestId & {
    toast: IToast;
    spinnerVariant?: TSpinnerProps['variant'];
    dismissLabel: string;
    onDismiss: () => void;
  };

const TOAST_TYPE_ICON: Record<TToastType, TIconName> = {
  [TOAST_TYPE.SUCCESS]: ICONS.CHECK,
  [TOAST_TYPE.INFO]: ICONS.INFO,
  [TOAST_TYPE.WARNING]: ICONS.WARNING,
  [TOAST_TYPE.ERROR]: ICONS.ERROR,
};

const TOAST_ANNOUNCEMENT: Record<
  TToastType,
  { role: 'status' | 'alert'; live: 'polite' | 'assertive' }
> = {
  [TOAST_TYPE.SUCCESS]: { role: 'status', live: 'polite' },
  [TOAST_TYPE.INFO]: { role: 'status', live: 'polite' },
  [TOAST_TYPE.WARNING]: { role: 'status', live: 'polite' },
  [TOAST_TYPE.ERROR]: { role: 'alert', live: 'assertive' },
};

/** A compact, transient notification reporting the result of an action, with an optional follow-up action and auto-dismiss timer. */
export const Toast = ({
  toast,
  spinnerVariant,
  dismissLabel,
  onDismiss,
  className,
  dataTestId,
}: TToastProps) => {
  const {
    type,
    isLoading = false,
    title,
    message,
    time,
    action,
    paused = false,
    durationMs,
    phase,
  } = toast;
  const s = toastVariants({ type, phase, hasTime: Boolean(time), paused });
  const { role, live } = TOAST_ANNOUNCEMENT[type];

  const typeIcon = isLoading ? (
    <Spinner
      label={type}
      variant={spinnerVariant}
      size={SIZE.SM}
      className={s.spinner()}
      aria-hidden="true"
      dataTestId="toast-spinner"
    />
  ) : (
    <Icon
      name={TOAST_TYPE_ICON[type]}
      size={SIZE.SM}
      className={s.icon()}
      dataTestId="toast-icon"
    />
  );

  const dismissButton = (
    <IconButton
      ariaLabel={dismissLabel}
      title={dismissLabel}
      onClick={onDismiss}
      className={s.dismiss()}
    >
      <Icon name={ICONS.CLOSE} size={SIZE.SM} dataTestId="toast-dismiss-icon" />
    </IconButton>
  );

  const actionButton = action && (
    <button type="button" onClick={action.onAct} className={s.action()}>
      {action.label}
      {action.keyHint && (
        <span className={s.actionKey()}>{action.keyHint}</span>
      )}
    </button>
  );

  return (
    <div
      role={role}
      aria-live={live}
      aria-atomic="true"
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      <div className={s.bar()}>
        {typeIcon}
        {title && <span className={s.titleText()}>{title}</span>}
        {time && <span className={s.time()}>{time}</span>}
        {dismissButton}
      </div>
      <div className={s.body()}>
        <div className={s.message()}>
          <span>{message}</span>
        </div>
        {actionButton && <div className={s.actions()}>{actionButton}</div>}
      </div>
      {!isUndefined(durationMs) && (
        <div
          className={s.timer()}
          style={
            {
              animationName: 'toast-drain',
              animationDuration: `${durationMs}ms`,
              animationTimingFunction: 'linear',
              animationFillMode: 'forwards',
            } as CSSProperties
          }
          data-testid={dataTestId && `${dataTestId}-timer`}
        />
      )}
    </div>
  );
};
