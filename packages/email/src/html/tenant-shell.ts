import { renderEmailShell } from './email-layout';

export type TTenantEmailBrand = {
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  brandPrimary: string;
  brandPrimarySolid: string;
  brandPrimaryContrast: string;
  logo1: string;
  logo2: string;
  logo3: string;
};

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
    brandName,
    previewText,
    bodyHtml,
    structuralHtml,
    actionHtml,
    logoImageUrl,
    footerPostalAddress,
  });
}
