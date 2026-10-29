import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { PropsWithChildren } from 'react';

import { footerFinePrintVariants } from './footer-fine-print-variants';

export type TFooterFinePrintProps = IWithClassName &
  IWithDataTestId &
  PropsWithChildren & {
    ariaLabel: string;
  };

/** The legal and settings links in the footer's bottom row, beside the copyright line. */
export const FooterFinePrint = ({
  ariaLabel,
  className,
  dataTestId,
  children,
}: TFooterFinePrintProps) => {
  if (!children) {
    return null;
  }
  return (
    <nav
      aria-label={ariaLabel}
      className={footerFinePrintVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </nav>
  );
};
