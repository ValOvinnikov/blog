import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { tableCaptionVariants } from './table-caption-variants';

export type TTableCaptionProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** The table's title, announced by screen readers as the table's name. */
export const TableCaption = ({
  className,
  dataTestId,
  children,
}: TTableCaptionProps) => (
  <caption
    className={tableCaptionVariants({ class: className })}
    data-testid={dataTestId}
  >
    {children}
  </caption>
);
