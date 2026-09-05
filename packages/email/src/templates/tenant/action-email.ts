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

export type TBuildTenantActionEmailInput = {
  /** A tenant's resolved palette — see `@blog/config`'s `resolveTenantEmailBrand`. */
  brand: TTenantEmailBrand;
  /** Displayed next to the mark in the header and in the footer's copyright line. */
  brandName: string;
  /** The inbox preview snippet shown alongside the subject line, before the email is opened. */
  previewText?: string;
  /** The tenant-authored Portable Text body — subject to the serializer's supported block set. */
  body: TPortableTextContent;
  /** The structural action, positioned after the body and before the footer — never part of `body`, so authoring it cannot relabel-away or remove it beyond its `label`. */
  action: TEmailAction;
};

/**
 * Renders a tenant transactional email: an authored Portable Text body
 * followed by a locked action element, inside the tenant's branded shell.
 * The action is composed independently of `body`, so no authored content —
 * empty, malicious, or otherwise — can remove or replace it.
 */
export function buildTenantActionEmail({
  brand,
  brandName,
  previewText,
  body,
  action,
}: TBuildTenantActionEmailInput): string {
  const bodyHtml = serializePortableText(body);
  const actionHtml = renderEmailAction(action, brand);

  return buildTenantShell({
    brand,
    brandName,
    previewText,
    bodyHtml: bodyHtml + actionHtml,
  });
}
