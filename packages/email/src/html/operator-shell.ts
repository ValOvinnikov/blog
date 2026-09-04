import { renderEmailShell } from './email-layout';
import { PLATFORM_EMAIL_BRAND } from './platform-email-brand';

const OPERATOR_BRAND_NAME = 'Tenant Alerts';

export type TBuildOperatorShellInput = {
  /** The inbox preview snippet shown alongside the subject line, before the email is opened. */
  previewText?: string;
  /** Already-assembled, already-escaped HTML for the message-specific content. */
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
