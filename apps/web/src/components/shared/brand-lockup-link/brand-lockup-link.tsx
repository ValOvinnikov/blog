import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

import { FallbackBrandLockup } from './components/fallback-brand-lockup/fallback-brand-lockup';

export interface IBrandLockupLinkProps {
  logoUrl?: string;
  tagline?: string;
}

export const BrandLockupLink = ({
  logoUrl,
  tagline,
}: IBrandLockupLinkProps) => {
  const t = useTranslations('brandLockupLink');

  return (
    <SmartLink href="/" aria-label={t('ariaLabel')}>
      <FallbackBrandLockup src={logoUrl} tagline={tagline} />
    </SmartLink>
  );
};
