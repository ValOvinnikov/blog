import {
  SIZE,
  SOCIAL_PLATFORM_ICON,
  SOCIAL_PLATFORM_LABEL,
} from '@blog/config';
import type { TSocialProfile } from '@blog/service';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NavLink } from '@blog/ui/components/atoms/nav-link';
import type { TNavLinkVariants } from '@blog/ui/components/atoms/nav-link/nav-link-variants';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import { socialLinkOnDarkVariants } from './social-links-variants';

export type TSocialLinkProps = TSocialProfile & {
  variant?: TNavLinkVariants['variant'];
  isOnDark?: boolean;
};

export const SocialLink = ({
  platform,
  link,
  variant,
  isOnDark,
}: TSocialLinkProps) => {
  const t = useTranslations('socialLinks');
  const platformLabel = SOCIAL_PLATFORM_LABEL[platform];

  return (
    <NavLink
      as={SmartLink}
      href={link.href}
      target={link.target}
      variant={variant}
      className={socialLinkOnDarkVariants({ isOnDark })}
      icon={
        <Icon
          name={SOCIAL_PLATFORM_ICON[platform]}
          size={SIZE.SM}
          dataTestId={`social-icon-${platform}`}
        />
      }
      hasLabel={false}
    >
      {t('linkAriaLabel', { platform: platformLabel })}
    </NavLink>
  );
};
