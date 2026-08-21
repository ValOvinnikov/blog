import type { TBrand } from '@blog/service';
import { BrandLockup } from '@blog/ui/molecules/brand-lockup';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

export interface IBrandLockupLinkProps {
  brand: TBrand;
}

/**
 * BrandLockupLink — the primary brand identity (logo mark), linked home.
 * Framework-coupled composition of `SmartLink` (routing) and `BrandLockup`
 * (`@blog/ui`, pure/prop-driven) — kept in `apps/web` because linking stays
 * out of `@blog/ui`. Used in the site header.
 */
export const BrandLockupLink = ({ brand }: IBrandLockupLinkProps) => {
  const t = useTranslations('brandLockupLink');

  return (
    <SmartLink href="/" aria-label={t('ariaLabel')}>
      <BrandLockup src={brand.logoUrl} specLine={brand.specLine} />
    </SmartLink>
  );
};
