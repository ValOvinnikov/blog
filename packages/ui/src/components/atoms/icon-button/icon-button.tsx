import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { AriaAttributes, MouseEventHandler, ReactNode, Ref } from 'react';

import {
  iconButtonVariants,
  type TIconButtonVariants,
} from './icon-button-variants';

export type TIconButtonProps = IWithClassName &
  TIconButtonVariants &
  IWithDataTestId & {
    ariaLabel: string;
    title?: string;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    isDisabled?: boolean;
    isFocusableWhenDisabled?: boolean;
    isInert?: boolean;
    'aria-expanded'?: AriaAttributes['aria-expanded'];
    'aria-controls'?: AriaAttributes['aria-controls'];
    'aria-haspopup'?: AriaAttributes['aria-haspopup'];
    ref?: Ref<HTMLButtonElement>;
  };

/** A compact button for an icon, short label or avatar action. */
export const IconButton = ({
  ariaLabel,
  title,
  className,
  variant,
  children,
  dataTestId,
  ref,
  onClick,
  isDisabled,
  isFocusableWhenDisabled,
  isInert,
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls,
  'aria-haspopup': ariaHaspopup,
}: TIconButtonProps) => {
  const isAriaDisabled = Boolean(isDisabled && isFocusableWhenDisabled);

  return (
    <button
      ref={ref}
      type="button"
      aria-label={ariaLabel}
      title={title}
      onClick={isAriaDisabled ? undefined : onClick}
      disabled={isDisabled && !isFocusableWhenDisabled}
      aria-disabled={isAriaDisabled || undefined}
      inert={isInert}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-haspopup={ariaHaspopup}
      data-testid={dataTestId}
      className={iconButtonVariants({ variant, class: className })}
    >
      {children}
    </button>
  );
};
