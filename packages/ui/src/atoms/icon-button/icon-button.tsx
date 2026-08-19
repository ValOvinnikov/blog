import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { AriaAttributes, MouseEventHandler, ReactNode, Ref } from 'react';

import { iconButtonVariants } from './icon-button-variants';

export type TIconButtonProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    title?: string;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    isDisabled?: boolean;
    isInert?: boolean;
    'aria-expanded'?: AriaAttributes['aria-expanded'];
    'aria-controls'?: AriaAttributes['aria-controls'];
    'aria-haspopup'?: AriaAttributes['aria-haspopup'];
    /** Forwarded to the underlying `<button>` so a caller composing this component (or managing focus directly) can reach the real node. */
    ref?: Ref<HTMLButtonElement>;
  };

/** A 22×22 icon-only button. Pass `ariaLabel` — no hardcoded accessible name. */
export const IconButton = ({
  ariaLabel,
  title,
  className,
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
    className={iconButtonVariants({ class: className })}
  >
    {children}
  </button>
);
