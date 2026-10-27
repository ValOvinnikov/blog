import { ICONS, SIZE } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { Icon } from '@platform/components/shared/icon';
import { Spinner } from '@platform/components/shared/spinner';
import type { AriaAttributes, MouseEventHandler, ReactNode, Ref } from 'react';

import { buttonVariants, type TButtonVariants } from './button-variants';

export type TButtonProps = {
  id?: string;
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
  'aria-expanded'?: AriaAttributes['aria-expanded'];
  'aria-controls'?: AriaAttributes['aria-controls'];
  'aria-current'?: AriaAttributes['aria-current'];
  'aria-label'?: AriaAttributes['aria-label'];
  title?: string;
  hasArrow?: boolean;
  ref?: Ref<HTMLButtonElement>;
};

export const Button = ({
  id,
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
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls,
  'aria-current': ariaCurrent,
  'aria-label': ariaLabel,
  title,
  hasArrow,
  ref,
}: TButtonProps) => {
  const { root, srOnlyStatus } = buttonVariants({ variant, size });
  const hasPendingLabel = !isUndefined(pendingLabel);
  const isPendingWithLabel = isPending && hasPendingLabel;
  const label = isPendingWithLabel ? pendingLabel : children;

  const hasClickBehaviour = !isUndefined(onClick) || isAriaDisabled;

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
        ref={ref}
        id={id}
        type={type}
        disabled={isDisabled || isPending}
        aria-disabled={isAriaDisabled || undefined}
        aria-busy={isPending}
        onClick={hasClickBehaviour ? handleClick : undefined}
        className={root({ class: className })}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        aria-current={ariaCurrent}
        aria-label={ariaLabel}
        title={title}
      >
        {isPending && (
          <span aria-hidden="true">
            <Spinner label="" size={SIZE.SM} />
          </span>
        )}
        {label}
        {hasArrow && <Icon name={ICONS.ARROW} size={SIZE.SM} />}
      </button>
      {hasPendingLabel && (
        <span role="status" aria-live="polite" className={srOnlyStatus()}>
          {isPendingWithLabel ? pendingLabel : ''}
        </span>
      )}
    </>
  );
};
