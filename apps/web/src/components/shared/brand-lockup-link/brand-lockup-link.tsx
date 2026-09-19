import { BrandLockup } from '@blog/ui/molecules/brand-lockup';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

export interface IBrandLockupLinkProps {
  logoUrl?: string;
  tagline?: string;
}

/**
 * Framework-coupled composition of `SmartLink` (routing) and `BrandLockup`
 * (`@blog/ui`, pure/prop-driven) — kept in `apps/web` because linking stays
 * out of `@blog/ui`.
 */
export const BrandLockupLink = ({
  logoUrl,
  tagline,
}: IBrandLockupLinkProps) => {
  const t = useTranslations('brandLockupLink');

  return (
    <SmartLink href="/" aria-label={t('ariaLabel')}>
      <BrandLockup src={logoUrl} tagline={tagline} />
    </SmartLink>
  );
};
