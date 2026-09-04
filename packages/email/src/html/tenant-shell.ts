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
}: TBuildTenantShellInput): string {
  return renderEmailShell({ palette: brand, brandName, previewText, bodyHtml });
}
