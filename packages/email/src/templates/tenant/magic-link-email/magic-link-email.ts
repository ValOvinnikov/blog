import {
  serializePortableText,
  type TPortableTextContent,
} from '@blog/email/portable-text';
import { buildSignInEmailShell } from '@blog/email/templates/tenant/sign-in-email-shell/sign-in-email-shell';
import type { TTenantEmailIdentity } from '@blog/email/templates/tenant/tenant-email-identity/tenant-email-identity';

export type TMagicLinkEmailInput = {
  url: string;
  tenantIdentity?: TTenantEmailIdentity;
  isSentByPlatform?: boolean;
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

export function buildMagicLinkEmail({
  url,
  tenantIdentity,
  isSentByPlatform,
  subject,
  body,
  logoImageUrl,
  footerPostalAddress,
}: TMagicLinkEmailInput): TMagicLinkEmailContent {
  return {
    subject,
    html: buildSignInEmailShell({
      title: subject,
      bodyHtml: serializePortableText(body),
      action: { label: SIGN_IN_ACTION_LABEL, url, variant: 'button' },
      tenantIdentity,
      isSentByPlatform,
      logoImageUrl,
      footerPostalAddress,
    }),
  };
}
