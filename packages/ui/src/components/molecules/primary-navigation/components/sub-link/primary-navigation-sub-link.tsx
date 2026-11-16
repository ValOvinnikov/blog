import { ICONS, SIZE } from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import {
  TextLink,
  type TTextLinkProps,
} from '@shinefold/ui/components/atoms/text-link';
import type { INavItem } from '@shinefold/ui/components/molecules/primary-navigation/primary-navigation';

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
