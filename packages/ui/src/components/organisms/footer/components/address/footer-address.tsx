import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { PropsWithChildren } from 'react';

import { footerAddressVariants } from './footer-address-variants';

export type TFooterAddressProps = IWithClassName &
  IWithDataTestId &
  PropsWithChildren;

/** The site's contact address in the footer's brand column. */
export const FooterAddress = ({
  className,
  dataTestId,
  children,
}: TFooterAddressProps) => {
  if (!children) {
    return null;
  }
  return (
    <address
      className={footerAddressVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </address>
  );
};
