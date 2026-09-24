import type { TSocialProfile } from '@blog/service';
import type { TNavLinkVariants } from '@blog/ui/components/atoms/nav-link/nav-link-variants';
import { useTranslations } from 'next-intl';

import { SocialLink } from './social-link';
import { socialLinksVariants } from './social-links-variants';

export type TSocialLinksProps = {
  profiles: TSocialProfile[];
  variant?: TNavLinkVariants['variant'];
};

export const SocialLinks = ({
  profiles,
  variant = 'plain',
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
          <SocialLink {...profile} variant={variant} />
        </li>
      ))}
    </ul>
  );
};
