import { ICONS, SIZE } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { PrimaryNavigationSubLink } from '@blog/ui/components/molecules/primary-navigation/components/sub-link/primary-navigation-sub-link';
import type { INavItem } from '@blog/ui/components/molecules/primary-navigation/primary-navigation';
import { splitSubItems } from '@blog/ui/components/molecules/primary-navigation/split-sub-items';

import { primaryNavigationPanelGroupVariants } from './primary-navigation-panel-group-variants';

export type TPrimaryNavigationPanelGroupProps = {
  item: INavItem;
  groupName: string;
  linkAs?: TAnchorElementType;
};

export const PrimaryNavigationPanelGroup = ({
  item,
  groupName,
  linkAs,
}: TPrimaryNavigationPanelGroupProps) => {
  const { lead, rest } = splitSubItems(item);
  const { root, summary, chevron, items, link } =
    primaryNavigationPanelGroupVariants({ isActive: item.isActive });

  return (
    <details name={groupName} className={root()}>
      <summary className={summary()}>
        {item.label}
        <Icon name={ICONS.CHEVRON_DOWN} size={SIZE.SM} className={chevron()} />
      </summary>
      <div className={items()}>
        {lead && (
          <PrimaryNavigationSubLink
            item={lead}
            isLead={true}
            appearance="nav"
            className={link({ isLead: true })}
            linkAs={linkAs}
          />
        )}
        {rest.map((subItem) => (
          <PrimaryNavigationSubLink
            key={subItem.href}
            item={subItem}
            isLead={false}
            appearance="nav"
            className={link()}
            linkAs={linkAs}
          />
        ))}
      </div>
    </details>
  );
};
