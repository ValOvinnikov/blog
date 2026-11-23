import { SmartLink } from '@web/components/shared/smart-link';
import type { IBrandLogos } from '@web/server/site-config/get-brand-logos/get-brand-logos';
import { useTranslations } from 'next-intl';

import { FallbackBrandLockup } from './components/fallback-brand-lockup/fallback-brand-lockup';

export interface IBrandLockupLinkProps extends IBrandLogos {
  siteName?: string;
  tagline?: string;
}

export const BrandLockupLink = ({
  logoUrl,
  darkLogoUrl,
  siteName,
  tagline,
}: IBrandLockupLinkProps) => {
  const t = useTranslations('brandLockupLink');

  return (
    <SmartLink href="/" aria-label={t('ariaLabel')}>
      <FallbackBrandLockup
        src={logoUrl}
        darkSrc={darkLogoUrl}
        siteName={siteName}
        tagline={tagline}
      />
    </SmartLink>
  );
};
