import { buildPlatformShell } from '@blog/email/html/platform-shell/platform-shell';

const OPERATOR_BRAND_NAME = 'Tenant Alerts';

export type TBuildOperatorShellInput = {
  previewText?: string;
  bodyHtml: string;
};

export function buildOperatorShell({
  previewText,
  bodyHtml,
}: TBuildOperatorShellInput): string {
  return buildPlatformShell({
    brandName: OPERATOR_BRAND_NAME,
    title: OPERATOR_BRAND_NAME,
    previewText,
    bodyHtml,
  });
}
