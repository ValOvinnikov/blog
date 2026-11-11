import {
  renderEmailAction,
  type TEmailAction,
} from '@blog/email/html/email-action/email-action';
import {
  FONT_STACK,
  SHELL_CONTENT_WIDTH_PX,
} from '@blog/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { sanitizeImageUrl } from '@blog/email/html/sanitize-image-url/sanitize-image-url';
import {
  buildTenantShell,
  type TTenantEmailBrand,
} from '@blog/email/html/tenant-shell/tenant-shell';
import { buildPlainTextBody } from '@blog/email/plain-text/plain-text-body';
import {
  buildListUnsubscribeHeaders,
  buildUnsubscribeAction,
} from '@blog/email/templates/tenant/unsubscribe/unsubscribe';
import { hasLength } from '@blog/utils/primitives';

export type TPostEmailInput = {
  subject: string;
  title: string;
  excerpt: string;
  postUrl: string;
  unsubscribeUrl: string;
  brand: TTenantEmailBrand;
  brandName: string;
  coverImageUrl?: string;
  takeaways?: string[];
  logoImageUrl?: string;
  footerPostalAddress?: string;
};

export type TPostEmailContent = {
  subject: string;
  html: string;
  text: string;
  headers: Record<string, string>;
};

function renderCoverImage(coverImageUrl?: string): string {
  const safeUrl = coverImageUrl ? sanitizeImageUrl(coverImageUrl) : null;
  if (!safeUrl) return '';

  // Outlook ignores max-width on images, so the width attribute holds the content column.
  return `<img src="${escapeHtml(safeUrl)}" width="${SHELL_CONTENT_WIDTH_PX}" alt="" style="display:block;width:100%;max-width:${SHELL_CONTENT_WIDTH_PX}px;height:auto;margin:0 0 24px;border:0;border-radius:6px;" />`;
}

function renderTakeaways(
  takeaways: string[],
  brand: TTenantEmailBrand,
): string {
  if (!hasLength(takeaways)) return '';

  const items = takeaways
    .map(
      (takeaway) => `<li style="margin:0 0 8px;">${escapeHtml(takeaway)}</li>`,
    )
    .join('');

  return `<ul style="margin:0 0 16px;padding:16px 16px 8px 32px;background-color:${brand.surface2};border-left:3px solid ${brand.border};">${items}</ul>`;
}

export function buildPostEmail({
  subject,
  title,
  excerpt,
  postUrl,
  unsubscribeUrl,
  brand,
  brandName,
  coverImageUrl,
  takeaways = [],
  logoImageUrl,
  footerPostalAddress,
}: TPostEmailInput): TPostEmailContent {
  const readAction: TEmailAction = {
    label: 'Read the post',
    url: postUrl,
    variant: 'button',
  };
  const unsubscribeAction = buildUnsubscribeAction(unsubscribeUrl);
  const footerLine = `You are receiving this because you subscribed to ${brandName}.`;

  const bodyHtml = [
    renderCoverImage(coverImageUrl),
    `<h1 style="margin:0 0 16px;font-family:${FONT_STACK};font-size:24px;line-height:1.3;color:${brand.text};">${escapeHtml(title)}</h1>`,
    renderTakeaways(takeaways, brand),
    `<p style="margin:0;">${escapeHtml(excerpt)}</p>`,
  ].join('');

  const actionHtml = [
    renderEmailAction(readAction, brand),
    `<p style="margin:24px 0 0;text-align:center;font-family:${FONT_STACK};font-size:12px;color:${brand.textMuted};">${escapeHtml(footerLine)}</p>`,
    renderEmailAction(unsubscribeAction, brand),
  ].join('');

  const textParagraphs = [
    title,
    ...takeaways.map((takeaway) => `- ${takeaway}`),
    excerpt,
  ];

  return {
    subject,
    html: buildTenantShell({
      brand,
      brandName,
      previewText: excerpt,
      bodyHtml,
      actionHtml,
      logoImageUrl,
      footerPostalAddress,
    }),
    text: [
      buildPlainTextBody(textParagraphs, readAction),
      buildPlainTextBody([footerLine], unsubscribeAction),
    ].join('\n\n'),
    headers: buildListUnsubscribeHeaders(unsubscribeUrl),
  };
}
