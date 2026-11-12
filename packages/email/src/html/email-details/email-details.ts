import { FONT_STACK } from '@blog/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { PLATFORM_EMAIL_BRAND } from '@blog/email/html/platform-email-brand/platform-email-brand';

export type TEmailDetail = {
  label: string;
  value: string;
};

export function renderEmailDetails(details: TEmailDetail[]): string {
  const rows = details
    .map(
      ({ label, value }) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid ${PLATFORM_EMAIL_BRAND.border};font-family:${FONT_STACK};font-size:14px;color:${PLATFORM_EMAIL_BRAND.textMuted};">${escapeHtml(label)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid ${PLATFORM_EMAIL_BRAND.border};font-family:${FONT_STACK};font-size:14px;font-weight:600;color:${PLATFORM_EMAIL_BRAND.text};">${escapeHtml(value)}</td></tr>`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${rows}</table>`;
}

export function detailsAsPlainText(details: TEmailDetail[]): string {
  return details.map(({ label, value }) => `${label}: ${value}`).join('\n');
}
