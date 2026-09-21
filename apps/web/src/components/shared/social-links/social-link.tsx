import {
  SIZE,
  SOCIAL_PLATFORM_ICON,
  SOCIAL_PLATFORM_LABEL,
} from '@blog/config';
import type { TSocialProfile } from '@blog/service';
import { Icon } from '@blog/ui/atoms/icon';
import { NavLink } from '@blog/ui/atoms/nav-link';
import type { TNavLinkVariants } from '@blog/ui/atoms/nav-link/nav-link-variants';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

export type TSocialLinkProps = TSocialProfile & {
  variant?: TNavLinkVariants['variant'];
};

export const SocialLink = ({ platform, link, variant }: TSocialLinkProps) => {
  const t = useTranslations('socialLinks');
  const platformLabel = SOCIAL_PLATFORM_LABEL[platform];

  return (
    <NavLink
      as={SmartLink}
      href={link.href}
      target={link.target}
      variant={variant}
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
