import {
  renderEmailAction,
  type TEmailAction,
} from '@shinefold/email/html/email-action/email-action';
import {
  buildNeutralShell,
  NEUTRAL_EMAIL_PALETTE,
} from '@shinefold/email/html/neutral-shell/neutral-shell';
import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_BRAND_NAME,
} from '@shinefold/email/html/platform-email-brand/platform-email-brand';
import { buildPlatformShell } from '@shinefold/email/html/platform-shell/platform-shell';
import { buildTenantShell } from '@shinefold/email/html/tenant-shell/tenant-shell';
import type { TTenantEmailIdentity } from '@shinefold/email/templates/tenant/tenant-email-identity/tenant-email-identity';

type TBuildSignInEmailShellInput = {
  title: string;
  bodyHtml: string;
  structuralHtml?: string;
  action: TEmailAction;
  tenantIdentity?: TTenantEmailIdentity;
  isSentByPlatform?: boolean;
  logoImageUrl?: string;
  footerPostalAddress?: string;
};

export function buildSignInEmailShell({
  title,
  bodyHtml,
  structuralHtml,
  action,
  tenantIdentity,
  isSentByPlatform,
  logoImageUrl,
  footerPostalAddress,
}: TBuildSignInEmailShellInput): string {
  if (tenantIdentity) {
    return buildTenantShell({
      brand: tenantIdentity.brand,
      brandName: tenantIdentity.brandName,
      bodyHtml,
      structuralHtml,
      actionHtml: renderEmailAction(action, tenantIdentity.brand),
      logoImageUrl,
      footerPostalAddress,
    });
  }

  if (isSentByPlatform) {
    return buildPlatformShell({
      brandName: PLATFORM_EMAIL_BRAND_NAME,
      title,
      bodyHtml,
      structuralHtml,
      actionHtml: renderEmailAction(action, PLATFORM_EMAIL_BRAND),
    });
  }

  return buildNeutralShell({
    title,
    bodyHtml,
    structuralHtml,
    actionHtml: renderEmailAction(action, NEUTRAL_EMAIL_PALETTE),
  });
}
