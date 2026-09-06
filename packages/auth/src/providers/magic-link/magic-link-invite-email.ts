import {
  buildTenantShell,
  renderEmailAction,
  serializePortableText,
  type TPortableTextContent,
} from '@blog/email';

import { escapeHtml } from './escape-html';
import type { TMagicLinkEmailContent } from './magic-link-email';
import type { TResolvedTenantEmailIdentity } from './resolve-tenant-email-identity';

export type TMagicLinkInviteEmailInput = {
  url: string;
  /** The sending host's resolved tenant, if any — see `resolveTenantEmailIdentity`. */
  tenantIdentity?: TResolvedTenantEmailIdentity;
  /** The resolved (authored-over-default) subject and body — see `resolveMagicLinkEmailSettings`. */
  subject: string;
  body: TPortableTextContent;
  /** The resolved tenant or per-template logo — see `resolveMagicLinkEmailSettings`. */
  logoImageUrl?: string;
  /** The tenant's configured footer postal address — see `resolveMagicLinkEmailSettings`. */
  footerPostalAddress?: string;
};

const ACCEPT_INVITE_ACTION_LABEL = 'Accept invite';

/**
 * Builds sign-in email copy for an address with a pending tenant invite. The
 * accept-invite link is rendered as a locked action element outside the
 * authored body, so no authored copy can remove or replace it.
 */
export function buildInviteMagicLinkEmail({
  url,
  tenantIdentity,
  subject,
  body,
  logoImageUrl,
  footerPostalAddress,
}: TMagicLinkInviteEmailInput): TMagicLinkEmailContent {
  const bodyHtml = serializePortableText(body);

  if (!tenantIdentity) {
    return {
      subject,
      html: `${bodyHtml}<p><a href="${escapeHtml(url)}">${ACCEPT_INVITE_ACTION_LABEL}</a></p>`,
    };
  }

  const actionHtml = renderEmailAction(
    { label: ACCEPT_INVITE_ACTION_LABEL, url, variant: 'button' },
    tenantIdentity.brand,
  );

  return {
    subject,
    html: buildTenantShell({
      brand: tenantIdentity.brand,
      brandName: tenantIdentity.brandName,
      bodyHtml,
      actionHtml,
      logoImageUrl,
      footerPostalAddress,
    }),
  };
}
