import type { TTenantEmailBrand } from '@shinefold/config';
import type { TEmailAction } from '@shinefold/email/html/email-action/email-action';
import { renderEmailButton } from '@shinefold/email/html/email-button/email-button';
import { renderEmailStack } from '@shinefold/email/html/email-document/email-document';
import { SHELL_WIDTH_PX } from '@shinefold/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { sanitizeImageUrl } from '@shinefold/email/html/sanitize-image-url/sanitize-image-url';
import { buildPlainTextBody } from '@shinefold/email/plain-text/plain-text-body';
import {
  POST_ACCENT_CLASS,
  POST_BOX_CLASS,
  POST_BUTTON_CLASS,
  POST_CARD_CLASS,
  POST_COVER_CLASS,
  POST_INNER_CLASS,
  POST_PAGE_PADDING_X_PX,
  POST_TEXT_CLASS,
  POST_TITLE_CLASS,
  type TPostEmailFonts,
} from '@shinefold/email/templates/tenant/post-email-frame/post-email-frame';
import { hasLength } from '@shinefold/utils/primitives';

export type TPostEmailCard = {
  title: string;
  excerpt: string;
  takeaways: string[];
  postUrl: string;
  coverImageUrl?: string;
};

const TAKEAWAYS_HEADING = 'Takeaways';

function readPostAction(postUrl: string): TEmailAction {
  return { label: 'Read the post', url: postUrl, variant: 'button' };
}

export function postCardAsPlainText({
  title,
  excerpt,
  takeaways,
  postUrl,
}: TPostEmailCard): string {
  return buildPlainTextBody(
    [
      title,
      ...(hasLength(takeaways)
        ? [TAKEAWAYS_HEADING, ...takeaways.map((takeaway) => `- ${takeaway}`)]
        : []),
      excerpt,
    ],
    readPostAction(postUrl),
  );
}

const CARD_WIDTH_PX = SHELL_WIDTH_PX - 2 * POST_PAGE_PADDING_X_PX;
const CARD_GAP_PX = 18;

function renderCover(coverImageUrl?: string): string {
  const safeUrl = coverImageUrl ? sanitizeImageUrl(coverImageUrl) : null;
  if (!safeUrl) return '';

  // Outlook desktop ignores object-fit and keeps the image's own proportions; other clients crop it to the fixed height.
  return `<tr><td style="padding:0;line-height:0;"><img class="${POST_COVER_CLASS}" src="${escapeHtml(safeUrl)}" width="${CARD_WIDTH_PX}" alt="" style="display:block;width:100%;max-width:${CARD_WIDTH_PX}px;height:280px;object-fit:cover;border:0;border-radius:11px 11px 0 0;" /></td></tr>`;
}

function renderTakeaways(
  takeaways: string[],
  brand: TTenantEmailBrand,
): string {
  if (!hasLength(takeaways)) return '';

  const items = takeaways
    .map(
      (takeaway, index) =>
        `<li style="margin:${index === 0 ? 0 : 8}px 0 0;">${escapeHtml(takeaway)}</li>`,
    )
    .join('');

  return [
    `<table role="presentation" class="${POST_BOX_CLASS}" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border:1px solid ${brand.border};border-radius:10px;">`,
    '<tr><td style="padding:16px 18px;">',
    `<h2 class="${POST_ACCENT_CLASS}" style="margin:0 0 10px;font-size:12px;font-weight:600;line-height:1.4;letter-spacing:0.08em;text-transform:uppercase;color:${brand.brandPrimary};">${TAKEAWAYS_HEADING}</h2>`,
    `<ul class="${POST_TEXT_CLASS}" style="margin:0;padding:0 0 0 18px;font-size:15px;line-height:1.5;color:${brand.text};">${items}</ul>`,
    '</td></tr>',
    '</table>',
  ].join('');
}

export function renderPostCard(
  { title, excerpt, takeaways, postUrl, coverImageUrl }: TPostEmailCard,
  brand: TTenantEmailBrand,
  fonts: TPostEmailFonts,
): string {
  const content = renderEmailStack(
    [
      `<h1 class="${POST_TITLE_CLASS} ${POST_TEXT_CLASS}" style="margin:0;font-family:${fonts.heading};font-size:34px;font-weight:600;line-height:1.15;color:${brand.text};">${escapeHtml(title)}</h1>`,
      renderTakeaways(takeaways, brand),
      `<p class="${POST_TEXT_CLASS}" style="margin:0;font-size:16px;line-height:1.6;color:${brand.text};">${escapeHtml(excerpt)}</p>`,
      renderEmailButton({
        ...readPostAction(postUrl),
        fill: brand.brandPrimarySolid,
        textColor: brand.brandPrimaryContrast,
        fontStack: fonts.body,
        fontSizePx: 15,
        radiusPx: 8,
        paddingYPx: 12,
        paddingXPx: 22,
        className: POST_BUTTON_CLASS,
      }),
    ],
    CARD_GAP_PX,
  );

  return [
    `<table role="presentation" class="${POST_CARD_CLASS}" width="100%" cellpadding="0" cellspacing="0" bgcolor="${brand.surface}" style="border-collapse:separate;background-color:${brand.surface};border:1px solid ${brand.border};border-radius:12px;">`,
    renderCover(coverImageUrl),
    `<tr><td class="${POST_INNER_CLASS}" style="padding:32px 36px 36px;font-family:${fonts.body};">${content}</td></tr>`,
    '</table>',
  ].join('');
}
