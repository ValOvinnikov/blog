import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { FooterGroup } from '@blog/ui/components/organisms/footer/components/group/footer-group';
import type { TCompoundChildren } from '@blog/ui/lib/react';
import { Children } from 'react';

import { footerGroupsVariants } from './footer-groups-variants';

export type TFooterGroupsProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    children?: TCompoundChildren<{ Group: typeof FooterGroup }>;
  };

/** The footer's named link groups, set two per row on phones and as one centred row of links in the Centred layout. */
export const FooterGroups = ({
  ariaLabel,
  className,
  dataTestId,
  children,
}: TFooterGroupsProps) => {
  if (Children.count(children) === 0) {
    return null;
  }
  return (
    <nav
      aria-label={ariaLabel}
      className={footerGroupsVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </nav>
  );
};
