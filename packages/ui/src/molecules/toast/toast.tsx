import {
  ICONS,
  Size,
  TOAST_TYPE,
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

export interface IToastProps extends IWithDataTestId {
  type: TToastType;
  /**
   * Overlays the type's glyph with a `Spinner` for an in-flight action (e.g.
   * a `toast.promise` pending state). The spinner is type-agnostic — it
   * always renders in `Spinner`'s own default accent color, so pairing
   * `isLoading: true` with `type: SUCCESS`/`WARNING`/`ERROR` won't tint it
   * to match.
   */
  isLoading?: boolean;
  command: string;
  state: string;
  message: ReactNode;
  time?: string;
  action?: IToastAction;
  dismissLabel: string;
  paused?: boolean;
  durationMs?: number;
  onDismiss: () => void;
  phase: NonNullable<TToastVariants['phase']>;
  className?: string;
}

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
  paused = false,
  durationMs,
  onDismiss,
  phase,
  className,
  dataTestId,
}: IToastProps) => {
  const s = toastVariants({
    type,
    phase,
    hasTime: Boolean(time),
    paused,
  });
  const { role, live } = TOAST_ANNOUNCEMENT[type];

  return (
    <div
      role={role}
      aria-live={live}
      aria-atomic="true"
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      <div className={s.bar()}>
        {isLoading ? (
          <Spinner
            label={state}
            size={Size.SM}
            className={s.spinner()}
            aria-hidden="true"
            dataTestId="toast-spinner"
          />
        ) : (
          <span className={s.glyph()} aria-hidden="true">
            {getToastGlyph(type, isLoading)}
          </span>
        )}
        <span className={s.cmdCommand()}>
          {command} · <span className={s.cmdState()}>{state}</span>
        </span>
        {time && <span className={s.time()}>{time}</span>}
        <IconButton
          ariaLabel={dismissLabel}
          title={dismissLabel}
          onClick={onDismiss}
          className={s.dismiss()}
        >
          <Icon name={ICONS.CLOSE} size={Size.SM} />
        </IconButton>
      </div>
      <div className={s.body()}>
        <div className={s.message()}>
          <span className={s.prompt()} aria-hidden="true">
            {getToastGlyph(type, isLoading)}
          </span>
          <span>{message}</span>
        </div>
        {action && (
          <div className={s.actions()}>
            <button type="button" onClick={action.onAct} className={s.action()}>
              {action.label}
              {action.keyHint && (
                <span className={s.actionKey()}>{action.keyHint}</span>
              )}
            </button>
          </div>
        )}
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
