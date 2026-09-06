import {
  renderEmailAction,
  type TEmailAction,
} from '@blog/email/html/email-action';
import {
  buildTenantShell,
  type TTenantEmailBrand,
} from '@blog/email/html/tenant-shell';
import {
  serializePortableText,
  type TPortableTextContent,
} from '@blog/email/portable-text';

export type TBuildTenantEmailInput = {
  brand: TTenantEmailBrand;
  brandName: string;
  previewText?: string;
  body: TPortableTextContent;
  /** Positioned after the body and before the footer, independent of `body` — omit for an email with no action. */
  action?: TEmailAction;
  /** An uploaded tenant or per-template logo image; falls back to the generated mark when omitted. */
  logoImageUrl?: string;
  /** Rendered beneath the copyright line in the footer. Omit for a send with no bulk-mail postal-address obligation. */
  footerPostalAddress?: string;
};

/**
 * Renders a tenant email — an authored Portable Text body, optionally
 * followed by a locked action element — inside the tenant's branded shell.
 */
export function buildTenantEmail({
  brand,
  brandName,
  previewText,
  body,
  action,
  logoImageUrl,
  footerPostalAddress,
}: TBuildTenantEmailInput): string {
  const bodyHtml = serializePortableText(body);
  const actionHtml = action ? renderEmailAction(action, brand) : undefined;

  return buildTenantShell({
    brand,
    brandName,
    previewText,
    bodyHtml,
    actionHtml,
    logoImageUrl,
    footerPostalAddress,
  });
}
