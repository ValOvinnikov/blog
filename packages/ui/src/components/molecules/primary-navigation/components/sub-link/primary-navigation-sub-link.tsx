import { ICONS, SIZE } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Icon } from '@blog/ui/components/atoms/icon';
import {
  TextLink,
  type TTextLinkProps,
} from '@blog/ui/components/atoms/text-link';
import type { INavItem } from '@blog/ui/components/molecules/primary-navigation/primary-navigation';

export type TPrimaryNavigationSubLinkProps = {
  item: INavItem;
  isLead: boolean;
  appearance: TTextLinkProps['appearance'];
  className: string;
  linkAs?: TAnchorElementType;
};

export const PrimaryNavigationSubLink = ({
  item: { href, label, isActive, target },
  isLead,
  appearance,
  className,
  linkAs,
}: TPrimaryNavigationSubLinkProps) => (
  <TextLink
    appearance={appearance}
    as={linkAs}
    href={href}
    isCurrent={isActive}
    currentStyle="weight"
    target={target}
    className={className}
  >
    {label}
    {isLead && <Icon name={ICONS.ARROW} size={SIZE.SM} />}
  </TextLink>
);
