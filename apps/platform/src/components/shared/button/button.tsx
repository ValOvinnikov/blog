import { ICONS, SIZE } from '@blog/config';
import { isUndefined } from '@blog/utils/primitives';
import { Icon } from '@platform/components/shared/icon';
import { Spinner } from '@platform/components/shared/spinner';
import { BUTTON_VARIANT } from '@platform/constants/button';
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
  const { root, faces, idleFace, busyFace, busyGlyph, srOnlyStatus } =
    buttonVariants({ variant, size, isPending });
  const hasPendingLabel = !isUndefined(pendingLabel);
  const isPendingWithLabel = isPending && hasPendingLabel;
  const isBlocked = isAriaDisabled || isPending;
  const isUnstyled =
    variant === BUTTON_VARIANT.UNSTYLED || variant === BUTTON_VARIANT.LINK;

  const hasClickBehaviour = !isUndefined(onClick) || isBlocked;

  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    if (isBlocked) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const busyContent = (
    <>
      <span aria-hidden="true">
        <Spinner label="" size={SIZE.SM} className={busyGlyph()} />
      </span>
      {pendingLabel ?? children}
    </>
  );

  return (
    <>
      <button
        ref={ref}
        id={id}
        type={type}
        disabled={isDisabled}
        aria-disabled={isBlocked || undefined}
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
        {isUnstyled ? (
          <>{isPending ? busyContent : children}</>
        ) : (
          <span className={faces()}>
            <span className={idleFace()} aria-hidden={isPending || undefined}>
              {children}
            </span>
            <span className={busyFace()} aria-hidden={!isPending || undefined}>
              {busyContent}
            </span>
          </span>
        )}
        {hasArrow && <Icon name={ICONS.ARROW} />}
      </button>
      {hasPendingLabel && (
        <span role="status" aria-live="polite" className={srOnlyStatus()}>
          {isPendingWithLabel ? pendingLabel : ''}
        </span>
      )}
    </>
  );
};
