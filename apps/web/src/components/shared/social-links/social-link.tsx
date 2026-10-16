import {
  SIZE,
  SOCIAL_PLATFORM_ICON,
  SOCIAL_PLATFORM_LABEL,
} from '@blog/config';
import type { TSocialProfile } from '@blog/service';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import type { TTextLinkVariants } from '@blog/ui/components/atoms/text-link/text-link-variants';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import { socialLinkOnDarkVariants } from './social-links-variants';

export type TSocialLinkProps = TSocialProfile & {
  variant?: TTextLinkVariants['variant'];
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
  const label = t('linkAriaLabel', { platform: platformLabel });

  return (
    <TextLink
      appearance="nav"
      as={SmartLink}
      href={link.href}
      target={link.target}
      variant={variant}
      className={socialLinkOnDarkVariants({ isOnDark })}
      ariaLabel={label}
      title={label}
    >
      <Icon
        name={SOCIAL_PLATFORM_ICON[platform]}
        size={SIZE.SM}
        dataTestId={`social-icon-${platform}`}
      />
    </TextLink>
  );
};
