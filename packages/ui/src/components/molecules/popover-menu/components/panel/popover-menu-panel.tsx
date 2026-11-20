import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { ReactNode, Ref } from 'react';

import { popoverMenuPanelVariants } from './popover-menu-panel-variants';

export type TPopoverMenuPanelProps = IWithClassName &
  IWithDataTestId & {
    id: string;
    isOpen: boolean;
    ariaLabel?: string;
    shouldOpenFromStartOnPhone?: boolean;
    children?: ReactNode;
    ref?: Ref<HTMLDivElement>;
  };

/** The non-modal menu surface (`role="menu"`) a `PopoverMenu.Trigger` opens. */
export const PopoverMenuPanel = ({
  id,
  isOpen,
  ariaLabel,
  shouldOpenFromStartOnPhone,
  ref,
  className,
  children,
  dataTestId,
}: TPopoverMenuPanelProps) => (
  <div
    ref={ref}
    id={id}
    role="menu"
    aria-label={ariaLabel}
    hidden={!isOpen}
    data-testid={dataTestId}
    className={popoverMenuPanelVariants({
      shouldOpenFromStartOnPhone,
      class: className,
    })}
  >
    {children}
  </div>
);
