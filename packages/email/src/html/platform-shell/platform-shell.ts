import { renderEmailShell } from '@blog/email/html/email-layout/email-layout';
import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';

export type TBuildPlatformShellInput = {
  brandName: string;
  title: string;
  previewText?: string;
  bodyHtml: string;
  actionHtml?: string;
};

/**
 * Wraps mail the platform sends in its own name, in the fixed platform
 * palette — never a tenant's, because there is no parameter through which one
 * could arrive.
 */
export function buildPlatformShell({
  brandName,
  title,
  previewText,
  bodyHtml,
  actionHtml,
}: TBuildPlatformShellInput): string {
  return renderEmailShell({
    palette: PLATFORM_EMAIL_BRAND,
    title,
    identity: { brandName, markPalette: PLATFORM_EMAIL_BRAND },
    previewText,
    bodyHtml,
    actionHtml,
  });
}
