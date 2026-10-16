import type { TSocialProfile } from '@blog/service';
import type { TTextLinkVariants } from '@blog/ui/components/atoms/text-link/text-link-variants';
import { useTranslations } from 'next-intl';

import { SocialLink } from './social-link';
import { socialLinksVariants } from './social-links-variants';

export type TSocialLinksProps = {
  profiles: TSocialProfile[];
  variant?: TTextLinkVariants['variant'];
  isOnDark?: boolean;
};

export const SocialLinks = ({
  profiles,
  variant = 'plain',
  isOnDark,
}: TSocialLinksProps) => {
  const t = useTranslations('socialLinks');

  return (
    <ul
      role="list"
      aria-label={t('listAriaLabel')}
      className={socialLinksVariants()}
    >
      {profiles.map((profile) => (
        <li key={profile.link.href}>
          <SocialLink {...profile} variant={variant} isOnDark={isOnDark} />
        </li>
      ))}
    </ul>
  );
};
