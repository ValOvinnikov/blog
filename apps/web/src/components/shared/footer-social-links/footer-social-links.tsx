import { SIZE, SOCIAL_PLATFORM_LABEL } from '@blog/config';
import type { TFooter } from '@blog/service';
import { Icon } from '@blog/ui/atoms/icon';
import { NavLink } from '@blog/ui/atoms/nav-link';
import { SmartLink } from '@web/components/shared/smart-link';
import { toSocialIconName } from '@web/utils/to-social-icon-name';
import { getTranslations } from 'next-intl/server';

export type TFooterSocialLinksProps = {
  social: TFooter['social'];
};

/**
 * FooterSocialLinks — renders the footer's social platform links, picking
 * each one's icon from its `platform` and deriving its accessible name from
 * that same platform rather than any authored label.
 */
export const FooterSocialLinks = async ({
  social,
}: TFooterSocialLinksProps) => {
  const t = await getTranslations('siteFooter');

  return (
    <>
      {social.map(({ platform, link }) => {
        const iconName = toSocialIconName(platform);
        const platformLabel = SOCIAL_PLATFORM_LABEL[platform];
        const hasLabel = !iconName;

        return (
          <NavLink
            key={link.href}
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
              : t('socialLinkAriaLabel', { platform: platformLabel })}
          </NavLink>
        );
      })}
    </>
  );
};
