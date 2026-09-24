import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { IconButton } from '@blog/ui/components/atoms/icon-button';
import type { TIconButtonVariants } from '@blog/ui/components/atoms/icon-button/icon-button-variants';
import type { MouseEventHandler, ReactNode, Ref } from 'react';

export type TPopoverMenuTriggerProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    isOpen: boolean;
    panelId: string;
    children: ReactNode;
    onClick?: MouseEventHandler<HTMLButtonElement>;
    variant?: TIconButtonVariants['variant'];
    ref?: Ref<HTMLButtonElement>;
  };

/** Icon-button that opens/closes a `PopoverMenu.Panel`. */
export const PopoverMenuTrigger = ({
  ariaLabel,
  isOpen,
  panelId,
  ref,
  className,
  variant,
  dataTestId,
  children,
  onClick,
}: TPopoverMenuTriggerProps) => (
  <IconButton
    ref={ref}
    ariaLabel={ariaLabel}
    title={ariaLabel}
    aria-haspopup="menu"
    aria-expanded={isOpen}
    aria-controls={panelId}
    variant={variant}
    className={className}
    dataTestId={dataTestId}
    onClick={onClick}
  >
    {children}
  </IconButton>
);
