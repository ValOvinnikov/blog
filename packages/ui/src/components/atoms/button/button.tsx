import {
  BUSY_BUTTON_STYLE,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Spinner, type TSpinnerProps } from '@blog/ui/components/atoms/spinner';
import type { AriaAttributes, MouseEventHandler, ReactNode } from 'react';

import {
  buttonBusyVariants,
  buttonVariants,
  type TButtonBusyVariants,
  type TButtonVariants,
} from './button-variants';

export type TButtonProps = IWithClassName &
  IWithDataTestId &
  TButtonVariants & {
    type?: 'button' | 'submit' | 'reset';
    title?: string;
    children?: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    isDisabled?: boolean;
    isBusy?: boolean;
    busyLabel?: string;
    busyStyle?: TButtonBusyVariants['busyStyle'];
    spinnerVariant?: TSpinnerProps['variant'];
    'aria-busy'?: AriaAttributes['aria-busy'];
    'aria-describedby'?: AriaAttributes['aria-describedby'];
  };

const preventBusyClick: MouseEventHandler<HTMLButtonElement> = (event) => {
  event.preventDefault();
};

/** The styled `<button>` for in-page actions (submit, toggle, dismiss), which stays focusable and full colour while busy. */
export const Button = ({
  className,
  variant,
  size,
  dataTestId,
  type = 'button',
  title,
  children,
  onClick,
  isDisabled,
  isBusy = false,
  busyLabel,
  busyStyle = BUSY_BUTTON_STYLE.LABEL,
  spinnerVariant,
  'aria-busy': ariaBusy,
  'aria-describedby': ariaDescribedby,
}: TButtonProps) => {
  const { faces, idleFace, keptFace, busyFace, edge, status } =
    buttonBusyVariants({ busyStyle, isBusy });
  const hasBusyLabel = Boolean(busyLabel);
  const isKept = busyStyle === BUSY_BUTTON_STYLE.KEPT;
  const isEdge = busyStyle === BUSY_BUTTON_STYLE.EDGE;

  const spinner = (
    <Spinner label="" variant={spinnerVariant} size={size} aria-hidden="true" />
  );

  return (
    <>
      <button
        type={type}
        title={title}
        onClick={isBusy ? preventBusyClick : onClick}
        disabled={isDisabled}
        aria-disabled={isBusy || undefined}
        aria-busy={isBusy || ariaBusy}
        aria-describedby={ariaDescribedby}
        data-testid={dataTestId}
        className={buttonVariants({ variant, size, class: className })}
      >
        {hasBusyLabel ? (
          <span className={faces()}>
            <span className={idleFace()} aria-hidden={isBusy || undefined}>
              {children}
            </span>
            {isKept && (
              <span className={keptFace()} aria-hidden={!isBusy || undefined}>
                {spinner}
                {children}
              </span>
            )}
            <span className={busyFace()} aria-hidden={!isBusy || undefined}>
              {!isEdge && spinner}
              {busyLabel}
            </span>
          </span>
        ) : (
          children
        )}
        {isBusy && isEdge && <span className={edge()} aria-hidden="true" />}
      </button>
      {hasBusyLabel && (
        <span role="status" aria-live="polite" className={status()}>
          {isBusy ? busyLabel : ''}
        </span>
      )}
    </>
  );
};
