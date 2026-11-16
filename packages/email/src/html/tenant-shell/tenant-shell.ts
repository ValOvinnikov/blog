import type { TTenantEmailBrand } from '@shinefold/config';
import { renderEmailShell } from '@shinefold/email/html/email-layout/email-layout';

export type TBuildTenantShellInput = {
  brand: TTenantEmailBrand;
  brandName: string;
  previewText?: string;
  bodyHtml: string;
  structuralHtml?: string;
  actionHtml?: string;
  logoImageUrl?: string;
  footerPostalAddress?: string;
};

export function buildTenantShell({
  brand,
  brandName,
  previewText,
  bodyHtml,
  structuralHtml,
  actionHtml,
  logoImageUrl,
  footerPostalAddress,
}: TBuildTenantShellInput): string {
  return renderEmailShell({
    palette: brand,
    title: brandName,
    identity: { brandName, logo: { tileColor: brand.logo1, logoImageUrl } },
    previewText,
    bodyHtml,
    structuralHtml,
    actionHtml,
    footerPostalAddress,
  });
}
