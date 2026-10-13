import { renderEmailAction } from '@blog/email/html/email-action/email-action';
import {
  buildNeutralShell,
  NEUTRAL_EMAIL_PALETTE,
} from '@blog/email/html/neutral-shell/neutral-shell';
import { buildTenantShell } from '@blog/email/html/tenant-shell/tenant-shell';
import {
  serializePortableText,
  type TPortableTextContent,
} from '@blog/email/portable-text';
import type { TTenantEmailIdentity } from '@blog/email/templates/tenant/tenant-email-identity/tenant-email-identity';

export type TMagicLinkEmailInput = {
  url: string;
  tenantIdentity?: TTenantEmailIdentity;
  subject: string;
  body: TPortableTextContent;
  logoImageUrl?: string;
  footerPostalAddress?: string;
};

export type TMagicLinkEmailContent = {
  subject: string;
  html: string;
};

const SIGN_IN_ACTION_LABEL = 'Sign in';

/**
 * Builds the sign-in email's subject and HTML body for the Auth.js Email
 * provider. The sign-in link is rendered as a locked action element outside
 * the authored body, so no authored copy can remove or replace it.
 */
export function buildMagicLinkEmail({
  url,
  tenantIdentity,
  subject,
  body,
  logoImageUrl,
  footerPostalAddress,
}: TMagicLinkEmailInput): TMagicLinkEmailContent {
  const bodyHtml = serializePortableText(body);

  const action = {
    label: SIGN_IN_ACTION_LABEL,
    url,
    variant: 'button',
  } as const;

  if (!tenantIdentity) {
    return {
      subject,
      html: buildNeutralShell({
        title: subject,
        bodyHtml,
        actionHtml: renderEmailAction(action, NEUTRAL_EMAIL_PALETTE),
      }),
    };
  }

  const actionHtml = renderEmailAction(action, tenantIdentity.brand);

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
