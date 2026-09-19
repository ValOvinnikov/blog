import { SIZE } from '@blog/config';
import { Spinner } from '@platform/components/shared/spinner';
import type { AriaAttributes, MouseEventHandler, ReactNode } from 'react';

import { buttonVariants, type TButtonVariants } from './button-variants';

export type TButtonProps = {
  variant?: TButtonVariants['variant'];
  size?: TButtonVariants['size'];
  type?: 'button' | 'submit' | 'reset';
  isDisabled?: boolean;
  isAriaDisabled?: boolean;
  isPending?: boolean;
  pendingLabel?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
  className?: string;
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  hasArrow?: boolean;
};

export const Button = ({
  variant,
  size,
  type = 'button',
  isDisabled,
  isAriaDisabled = false,
  isPending = false,
  pendingLabel,
  onClick,
  children,
  className,
  'aria-describedby': ariaDescribedBy,
  hasArrow,
}: TButtonProps) => {
  const { root, srOnlyStatus } = buttonVariants({ variant, size });
  const hasPendingLabel = pendingLabel !== undefined;
  const isPendingWithLabel = isPending && hasPendingLabel;
  const label = isPendingWithLabel ? pendingLabel : children;

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (isAriaDisabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  return (
    <>
      <button
        type={type}
        disabled={isDisabled || isPending}
        aria-disabled={isAriaDisabled || undefined}
        aria-busy={isPending}
        onClick={handleClick}
        className={root({ class: className })}
        aria-describedby={ariaDescribedBy}
      >
        {isPending && (
          <span aria-hidden="true">
            <Spinner label="" size={SIZE.SM} />
          </span>
        )}
        {label}
        {hasArrow && <span aria-hidden="true"> →</span>}
      </button>
      {hasPendingLabel && (
        <span role="status" aria-live="polite" className={srOnlyStatus()}>
          {isPendingWithLabel ? pendingLabel : ''}
        </span>
      )}
    </>
  );
};
