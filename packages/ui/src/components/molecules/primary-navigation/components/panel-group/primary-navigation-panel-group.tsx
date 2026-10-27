import { ICONS, SIZE } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
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

  const renderLink = (
    { href, label, isActive, target }: INavItem,
    isLead: boolean,
  ) => (
    <TextLink
      key={href}
      appearance="nav"
      as={linkAs}
      href={href}
      isCurrent={isActive}
      currentStyle="weight"
      target={target}
      className={link({ isLead })}
    >
      {label}
      {isLead && <Icon name={ICONS.ARROW} size={SIZE.SM} />}
    </TextLink>
  );

  return (
    <details name={groupName} className={root()}>
      <summary className={summary()}>
        {item.label}
        <Icon name={ICONS.CHEVRON_DOWN} size={SIZE.SM} className={chevron()} />
      </summary>
      <div className={items()}>
        {lead && renderLink(lead, true)}
        {rest.map((subItem) => renderLink(subItem, false))}
      </div>
    </details>
  );
};
