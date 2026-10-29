import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { PropsWithChildren } from 'react';

import { footerSocialVariants } from './footer-social-variants';

export type TFooterSocialProps = IWithClassName &
  IWithDataTestId &
  PropsWithChildren;

/** The site's social profile links, last in the footer's brand column. */
export const FooterSocial = ({
  className,
  dataTestId,
  children,
}: TFooterSocialProps) => {
  if (!children) {
    return null;
  }
  return (
    <div
      className={footerSocialVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </div>
  );
};
