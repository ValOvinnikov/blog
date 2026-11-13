import { renderEmailShell } from '@blog/email/html/email-layout/email-layout';
import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_MARK,
} from '@blog/email/html/platform-email-brand/platform-email-brand';

const OPERATOR_BRAND_NAME = 'Tenant Alerts';

export type TBuildOperatorShellInput = {
  previewText?: string;
  bodyHtml: string;
  actionHtml?: string;
};

export function buildOperatorShell({
  previewText,
  bodyHtml,
  actionHtml,
}: TBuildOperatorShellInput): string {
  return renderEmailShell({
    palette: PLATFORM_EMAIL_BRAND,
    title: OPERATOR_BRAND_NAME,
    identity: {
      brandName: OPERATOR_BRAND_NAME,
      logo: { markImage: PLATFORM_EMAIL_MARK },
    },
    previewText,
    bodyHtml,
    actionHtml,
  });
}
