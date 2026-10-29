import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { footerGroupItemVariants } from './footer-group-item-variants';

export type TFooterGroupItemProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** One entry in a footer link group: a link, or any other content such as plain text. */
export const FooterGroupItem = ({
  className,
  dataTestId,
  children,
}: TFooterGroupItemProps) => (
  <li
    className={footerGroupItemVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </li>
);
