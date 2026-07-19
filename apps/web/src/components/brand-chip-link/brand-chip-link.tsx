import type { TBrand } from '@blog/service';
import { TerminalChip } from '@blog/ui';
import { SmartLink } from '@web/components/smart-link/smart-link';

export interface IBrandChipLinkProps {
  brand: TBrand;
}

/**
 * BrandChipLink — the secondary, muted brand mark (terminal-prompt chip),
 * linked home. Framework-coupled composition of `SmartLink` (routing) and
 * `TerminalChip` (`@blog/ui`, pure/prop-driven) — kept in `apps/web` because
 * linking stays out of `@blog/ui`. Used in the site footer; the cursor is
 * switched off to keep the footer calm.
 */
export const BrandChipLink = ({ brand }: IBrandChipLinkProps) => (
  <SmartLink href="/" aria-label="Home">
    <TerminalChip
      prefix={brand.prefix}
      suffix={brand.suffix}
      showCursor={false}
    />
  </SmartLink>
);
