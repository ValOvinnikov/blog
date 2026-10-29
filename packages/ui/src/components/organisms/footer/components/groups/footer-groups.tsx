import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { FooterGroup } from '@blog/ui/components/organisms/footer/components/group/footer-group';
import type { TCompoundChildren } from '@blog/ui/lib/react';

import { footerGroupsVariants } from './footer-groups-variants';
import { hasGroupItems } from './has-group-items';

export type TFooterGroupsProps = IWithClassName &
  IWithDataTestId & {
    ariaLabel: string;
    children?: TCompoundChildren<{ Group: typeof FooterGroup }>;
  };

/** The footer's navigation landmark for the editor's link groups. */
export const FooterGroups = ({
  ariaLabel,
  className,
  dataTestId,
  children,
}: TFooterGroupsProps) => {
  if (!hasGroupItems(children)) {
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
