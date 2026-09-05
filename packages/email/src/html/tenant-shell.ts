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
  /** A tenant's resolved palette — see `@blog/config`'s `resolveTenantEmailBrand`. */
  brand: TTenantEmailBrand;
  /** Displayed next to the mark in the header and in the footer's copyright line. */
  brandName: string;
  /** The inbox preview snippet shown alongside the subject line, before the email is opened. */
  previewText?: string;
  /** Already-assembled, already-escaped HTML for the message-specific content. */
  bodyHtml: string;
  /** Already-assembled, already-escaped HTML rendered between the body and the footer. Omit for an email with no action. */
  actionHtml?: string;
  /** An uploaded tenant or per-template logo image; falls back to the generated mark when omitted. */
  logoImageUrl?: string;
  /** Rendered beneath the copyright line in the footer. Omit for a send with no bulk-mail postal-address obligation. */
  footerPostalAddress?: string;
};

/**
 * Wraps message-specific HTML in the shared branded email layout, styled
 * with a tenant's own resolved palette rather than the platform's.
 */
export function buildTenantShell({
  brand,
  brandName,
  previewText,
  bodyHtml,
  actionHtml,
  logoImageUrl,
  footerPostalAddress,
}: TBuildTenantShellInput): string {
  return renderEmailShell({
    palette: brand,
    brandName,
    previewText,
    bodyHtml,
    actionHtml,
    logoImageUrl,
    footerPostalAddress,
  });
}
