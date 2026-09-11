import { BrandLockup } from '@blog/ui/molecules/brand-lockup';
import { SmartLink } from '@web/components/shared/smart-link';
import { useTranslations } from 'next-intl';

export interface IBrandLockupLinkProps {
  /** The brand logo, already resolved to a rendered URL by the caller. */
  logoUrl?: string;
  specLine?: string;
}

/**
 * BrandLockupLink — the primary brand identity (logo mark), linked home.
 * Framework-coupled composition of `SmartLink` (routing) and `BrandLockup`
 * (`@blog/ui`, pure/prop-driven) — kept in `apps/web` because linking stays
 * out of `@blog/ui`. Used in the site header.
 */
export const BrandLockupLink = ({
  logoUrl,
  specLine,
}: IBrandLockupLinkProps) => {
  const t = useTranslations('brandLockupLink');

  return (
    <SmartLink href="/" aria-label={t('ariaLabel')}>
      <BrandLockup src={logoUrl} specLine={specLine} />
    </SmartLink>
  );
};
