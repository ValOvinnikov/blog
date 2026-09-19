import type {
  IWithClassName,
  IWithDataTestId,
  TBrandVariant,
} from '@blog/config';
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
    isInert?: boolean;
    tone?: TBrandVariant;
    'aria-expanded'?: AriaAttributes['aria-expanded'];
    'aria-controls'?: AriaAttributes['aria-controls'];
    'aria-haspopup'?: AriaAttributes['aria-haspopup'];
    ref?: Ref<HTMLButtonElement>;
  };

/** A compact button for icon, labelled, or avatar-triggered actions: a 22×22 icon-only default, a `bordered` variant sized to its text label, a 32×32 circular `avatar` variant, and a 36×36 outlined `control` variant for a standalone control (e.g. carousel navigation). */
export const IconButton = ({
  ariaLabel,
  title,
  className,
  variant,
  tone,
  children,
  dataTestId,
  ref,
  onClick,
  isDisabled,
  isInert,
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls,
  'aria-haspopup': ariaHaspopup,
}: TIconButtonProps) => (
  <button
    ref={ref}
    type="button"
    aria-label={ariaLabel}
    title={title}
    onClick={onClick}
    disabled={isDisabled}
    inert={isInert}
    aria-expanded={ariaExpanded}
    aria-controls={ariaControls}
    aria-haspopup={ariaHaspopup}
    data-testid={dataTestId}
    className={iconButtonVariants({ variant, tone, class: className })}
  >
    {children}
  </button>
);
