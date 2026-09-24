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
import { Spinner } from '@blog/ui/components/atoms/spinner';
import type { CSSProperties, ReactNode } from 'react';

import { toastVariants, type TToastVariants } from './toast-variants';

export interface IToastAction {
  label: string;
  onAct: () => void;
  keyHint?: string;
}

export type TToastProps = IWithClassName &
  IWithDataTestId & {
    type: TToastType;
    isLoading?: boolean;
    title?: ReactNode;
    message: ReactNode;
    time?: string;
    action?: IToastAction;
    dismissLabel: string;
    isPaused?: boolean;
    durationMs?: number;
    onDismiss: () => void;
    phase: NonNullable<TToastVariants['phase']>;
  };

const TOAST_TYPE_ICON: Record<TToastType, TIconName> = {
  [TOAST_TYPE.SUCCESS]: ICONS.CHECK,
  [TOAST_TYPE.INFO]: ICONS.INFO,
  [TOAST_TYPE.WARNING]: ICONS.WARNING,
  [TOAST_TYPE.ERROR]: ICONS.CLOSE,
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

/** A single compact notification confirming or reporting the result of an engagement action (bookmark, rating, comment, subscription, auth). */
export const Toast = ({
  type,
  isLoading = false,
  title,
  message,
  time,
  action,
  dismissLabel,
  isPaused = false,
  durationMs,
  onDismiss,
  phase,
  className,
  dataTestId,
}: TToastProps) => {
  const s = toastVariants({
    type,
    phase,
    hasTime: Boolean(time),
    paused: isPaused,
  });
  const { role, live } = TOAST_ANNOUNCEMENT[type];

  const typeIcon = isLoading ? (
    <Spinner
      label={type}
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
      {durationMs !== undefined && (
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
