import { renderEmailShell } from '@blog/email/html/email-layout/email-layout';
import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';

const OPERATOR_BRAND_NAME = 'Tenant Alerts';

export type TBuildOperatorShellInput = {
  previewText?: string;
  bodyHtml: string;
};

/**
 * Wraps operator-alert HTML in the shared branded email layout, styled with
 * the fixed platform palette — never a tenant's, because there is no
 * parameter through which one could arrive.
 */
export function buildOperatorShell({
  previewText,
  bodyHtml,
}: TBuildOperatorShellInput): string {
  return renderEmailShell({
    palette: PLATFORM_EMAIL_BRAND,
    brandName: OPERATOR_BRAND_NAME,
    previewText,
    bodyHtml,
  });
}
