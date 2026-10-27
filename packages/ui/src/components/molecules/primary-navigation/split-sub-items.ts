import type { TMaybeUndefined } from '@blog/config';

import type { INavItem } from './primary-navigation';

export const splitSubItems = ({
  href,
  subItems = [],
}: INavItem): { lead: TMaybeUndefined<INavItem>; rest: INavItem[] } => ({
  lead: subItems.find((subItem) => subItem.href === href),
  rest: subItems.filter((subItem) => subItem.href !== href),
});
