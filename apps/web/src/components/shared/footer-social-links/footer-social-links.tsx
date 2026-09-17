import {
  SIZE,
  SOCIAL_PLATFORM_ICON,
  SOCIAL_PLATFORM_LABEL,
} from '@blog/config';
import type { TFooter } from '@blog/service';
import { Icon } from '@blog/ui/atoms/icon';
import { NavLink } from '@blog/ui/atoms/nav-link';
import { SmartLink } from '@web/components/shared/smart-link';
import { getTranslations } from 'next-intl/server';

export type TFooterSocialLinksProps = {
  social: TFooter['social'];
};

export const FooterSocialLinks = async ({
  social,
}: TFooterSocialLinksProps) => {
  const t = await getTranslations('siteFooter');

  return (
    <>
      {social.map(({ platform, link }) => {
        const platformLabel = SOCIAL_PLATFORM_LABEL[platform];

        return (
          <NavLink
            key={link.href}
            as={SmartLink}
            href={link.href}
            target={link.target}
            icon={
              <Icon
                name={SOCIAL_PLATFORM_ICON[platform]}
                size={SIZE.SM}
                dataTestId={`social-icon-${platform}`}
              />
            }
            hasLabel={false}
          >
            {t('socialLinkAriaLabel', { platform: platformLabel })}
          </NavLink>
        );
      })}
    </>
  );
};
