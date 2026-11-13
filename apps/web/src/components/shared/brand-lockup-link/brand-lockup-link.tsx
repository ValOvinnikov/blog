import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import { FallbackBrandLockup } from './components/fallback-brand-lockup/fallback-brand-lockup';

export interface IBrandLockupLinkProps {
  logoUrl?: string;
  siteName?: string;
  tagline?: string;
}

export const BrandLockupLink = ({
  logoUrl,
  siteName,
  tagline,
}: IBrandLockupLinkProps) => {
  const t = useTranslations('brandLockupLink');

  return (
    <SmartLink href="/" aria-label={t('ariaLabel')}>
      <FallbackBrandLockup
        src={logoUrl}
        siteName={siteName}
        tagline={tagline}
      />
    </SmartLink>
  );
};
