import {
  SIZE,
  SOCIAL_PLATFORM_ICON,
  SOCIAL_PLATFORM_LABEL,
} from '@shinefold/config';
import type { TSocialProfile } from '@shinefold/service';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import type { TTextLinkVariants } from '@shinefold/ui/components/atoms/text-link/text-link-variants';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

export type TSocialLinkProps = TSocialProfile & {
  variant?: TTextLinkVariants['variant'];
};

export const SocialLink = ({ platform, link, variant }: TSocialLinkProps) => {
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
