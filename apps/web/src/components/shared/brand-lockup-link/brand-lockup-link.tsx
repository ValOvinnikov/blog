import type { TBrand } from '@blog/service';
import { BrandLockup } from '@blog/ui';
import { SmartLink } from '@web/components/shared/smart-link';

export interface IBrandLockupLinkProps {
  brand: TBrand;
}

/**
 * BrandLockupLink — the primary brand identity (mark + wordmark), linked
 * home. Framework-coupled composition of `SmartLink` (routing) and
 * `BrandLockup` (`@blog/ui`, pure/prop-driven) — kept in `apps/web` because
 * linking stays out of `@blog/ui`. Used in the site header.
 */
export const BrandLockupLink = ({ brand }: IBrandLockupLinkProps) => (
  <SmartLink href="/" aria-label="Home">
    <BrandLockup
      prefix={brand.prefix}
      suffix={brand.suffix}
      specLine={brand.specLine}
    />
  </SmartLink>
);
