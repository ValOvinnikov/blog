import {
  ICONS,
  SIZE,
  TOAST_TYPE,
  type IWithClassName,
  type IWithDataTestId,
  type TToastType,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { IconButton } from '@blog/ui/atoms/icon-button';
import { Spinner } from '@blog/ui/atoms/spinner';
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
    /**
     * Overlays the type's glyph with a `Spinner` for an in-flight action (e.g.
     * a `toast.promise` pending state). The spinner is type-agnostic — it
     * always renders in `Spinner`'s own default accent color, so pairing
     * `isLoading: true` with `type: SUCCESS`/`WARNING`/`ERROR` won't tint it
     * to match.
     */
    isLoading?: boolean;
    /**
     * Required unless `isPlain` is set — the terminal-style command/state chip
     * (e.g. "bookmark · saved") is only rendered when `isPlain` is falsy.
     */
    command?: string;
    state?: string;
    message: ReactNode;
    time?: string;
    action?: IToastAction;
    dismissLabel: string;
    isPaused?: boolean;
    durationMs?: number;
    onDismiss: () => void;
    phase: NonNullable<TToastVariants['phase']>;
    /**
     * Renders `message` alone, without the `command`/`state` chip — for
     * presets that don't want the toast to read as terminal-log output.
     */
    isPlain?: boolean;
  };

const TOAST_GLYPH: Record<TToastType, string> = {
  [TOAST_TYPE.SUCCESS]: '✓',
  [TOAST_TYPE.INFO]: '›',
  [TOAST_TYPE.WARNING]: '●',
  [TOAST_TYPE.ERROR]: '✕',
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

const getToastGlyph = (type: TToastType, isLoading: boolean): string =>
  isLoading ? '◐' : TOAST_GLYPH[type];

/**
 * Toast — a single compact terminal-window notification confirming or
 * reporting the result of an engagement action (bookmark, rating, comment,
 * subscription, auth). Purely presentational and controlled: the queue,
 * timers, and phase/pause transitions are owned by a stateful `apps/web`
 * island that re-renders this component with updated props.
 */
export const Toast = ({
  type,
  isLoading = false,
  command,
  state,
  message,
  time,
  action,
  dismissLabel,
  isPaused = false,
  durationMs,
  onDismiss,
  phase,
  isPlain = false,
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

  const statusGlyph = isLoading ? (
    <Spinner
      label={state ?? type}
      size={SIZE.SM}
      className={s.spinner()}
      aria-hidden="true"
      dataTestId="toast-spinner"
    />
  ) : (
    <span className={s.glyph()} aria-hidden="true">
      {getToastGlyph(type, isLoading)}
    </span>
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
      {isPlain ? (
        <div className={s.plainRow()}>
          {statusGlyph}
          <span className={s.plainMessage()}>{message}</span>
          {time && <span className={s.time()}>{time}</span>}
          {dismissButton}
        </div>
      ) : (
        <>
          <div className={s.bar()}>
            {statusGlyph}
            <span className={s.cmdCommand()}>
              {command} · <span className={s.cmdState()}>{state}</span>
            </span>
            {time && <span className={s.time()}>{time}</span>}
            {dismissButton}
          </div>
          <div className={s.body()}>
            <div className={s.message()}>
              <span className={s.prompt()} aria-hidden="true">
                {getToastGlyph(type, isLoading)}
              </span>
              <span>{message}</span>
            </div>
            {actionButton && <div className={s.actions()}>{actionButton}</div>}
          </div>
        </>
      )}
      {isPlain && actionButton && (
        <div className={s.plainActions()}>{actionButton}</div>
      )}
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
