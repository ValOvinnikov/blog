import { SIZE, SOCIAL_PLATFORM_LABEL } from '@blog/config';
import type { TSocialProfile } from '@blog/service';
import { Icon } from '@blog/ui/atoms/icon';
import { NavLink } from '@blog/ui/atoms/nav-link';
import { SmartLink } from '@web/components/shared/smart-link';
import { toSocialIconName } from '@web/utils/to-social-icon-name';
import { getTranslations } from 'next-intl/server';
import { Fragment, type ElementType } from 'react';

export type TSocialLinksProps = {
  social: TSocialProfile[];
  itemAs?: ElementType;
};

export const SocialLinks = async ({
  social,
  itemAs: ItemWrapper = Fragment,
}: TSocialLinksProps) => {
  const t = await getTranslations('socialLinks');

  return (
    <>
      {social.map(({ platform, link }) => {
        const iconName = toSocialIconName(platform);
        const platformLabel = SOCIAL_PLATFORM_LABEL[platform];
        const hasLabel = !iconName;

        return (
          <ItemWrapper key={link.href}>
            <NavLink
              as={SmartLink}
              href={link.href}
              target={link.target}
              icon={
                iconName ? (
                  <Icon
                    name={iconName}
                    size={SIZE.SM}
                    dataTestId={`social-icon-${platform}`}
                  />
                ) : undefined
              }
              hasLabel={hasLabel}
            >
              {hasLabel
                ? platformLabel
                : t('linkAriaLabel', { platform: platformLabel })}
            </NavLink>
          </ItemWrapper>
        );
      })}
    </>
  );
};
