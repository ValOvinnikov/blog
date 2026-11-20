import type { TEmailAction } from '@shinefold/email/html/email-action/email-action';
import { renderEmailButton } from '@shinefold/email/html/email-button/email-button';
import {
  renderEmailDocument,
  renderEmailStack,
} from '@shinefold/email/html/email-document/email-document';
import { FONT_STACK } from '@shinefold/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { PLATFORM_EMAIL_BRAND } from '@shinefold/email/html/platform-email-brand/platform-email-brand';
import { buildPlainTextBody } from '@shinefold/email/plain-text/plain-text-body';
import type { TOwnerEmail } from '@shinefold/email/templates/owner/owner-email/owner-email';
import {
  OWNER_CARD_CLASS,
  OWNER_PAGE_CLASS,
  OWNER_TEXT_CLASS,
  renderOwnerFooter,
  renderOwnerLimitEmailCss,
  renderOwnerWordmark,
} from '@shinefold/email/templates/owner/owner-limit-email-frame/owner-limit-email-frame';
import {
  renderOwnerUsageBox,
  type TOwnerUsageRow,
  usageRowsAsPlainText,
} from '@shinefold/email/templates/owner/owner-usage-box/owner-usage-box';
import { hasLength } from '@shinefold/utils/primitives';
import { SHINEFOLD_LOGO_COLOR } from '@shinefold/utils/shinefold-logo';

export type TOwnerLimitEmailInput = {
  brandName: string;
  subject: string;
  previewText?: string;
  heading?: string;
  paragraphs: string[];
  usage?: TOwnerUsageRow[];
  closingLine?: string;
  action: TEmailAction;
  footerLine?: string;
};

const BLOCK_GAP_PX = 16;

function renderParagraph(text: string): string {
  return `<p class="${OWNER_TEXT_CLASS}" style="margin:0;font-size:15px;line-height:1.6;color:${PLATFORM_EMAIL_BRAND.text};">${escapeHtml(text)}</p>`;
}

function renderCard({
  heading,
  paragraphs,
  usage = [],
  closingLine,
  action,
}: TOwnerLimitEmailInput): string {
  const { surface, border, text } = PLATFORM_EMAIL_BRAND;
  const content = renderEmailStack(
    [
      heading
        ? `<h1 class="${OWNER_TEXT_CLASS}" style="margin:0;font-size:22px;font-weight:700;line-height:1.3;color:${text};">${escapeHtml(heading)}</h1>`
        : '',
      ...paragraphs.map(renderParagraph),
      hasLength(usage) ? renderOwnerUsageBox(usage) : '',
      closingLine ? renderParagraph(closingLine) : '',
      renderEmailButton({
        label: action.label,
        url: action.url,
        fill: SHINEFOLD_LOGO_COLOR.YELLOW,
        textColor: SHINEFOLD_LOGO_COLOR.INK,
        fontStack: FONT_STACK,
        fontSizePx: 15,
        radiusPx: 10,
        paddingYPx: 13,
        paddingXPx: 22,
      }),
    ],
    BLOCK_GAP_PX,
  );

  return `<table role="presentation" class="${OWNER_CARD_CLASS}" width="100%" cellpadding="0" cellspacing="0" bgcolor="${surface}" style="border-collapse:separate;background-color:${surface};border:1px solid ${border};border-radius:12px;"><tr><td style="padding:28px;">${content}</td></tr></table>`;
}

export function buildOwnerLimitEmail(
  input: TOwnerLimitEmailInput,
): TOwnerEmail {
  const {
    brandName,
    subject,
    previewText,
    heading,
    paragraphs,
    usage = [],
    closingLine,
    action,
    footerLine,
  } = input;
  const { surface2, text } = PLATFORM_EMAIL_BRAND;
  const html = renderEmailDocument({
    title: subject,
    previewText,
    css: renderOwnerLimitEmailCss(),
    pageColor: surface2,
    pageClassName: OWNER_PAGE_CLASS,
    textColor: text,
    fontStack: FONT_STACK,
    contentPadding: '32px 36px',
    contentClassName: OWNER_PAGE_CLASS,
    blockGapPx: BLOCK_GAP_PX,
    blocks: [
      renderOwnerWordmark(brandName),
      renderCard(input),
      renderOwnerFooter(footerLine),
    ],
  });
  const textParagraphs = [
    ...(heading ? [heading] : []),
    ...paragraphs,
    ...(hasLength(usage) ? [usageRowsAsPlainText(usage)] : []),
    ...(closingLine ? [closingLine] : []),
  ];

  return {
    subject,
    html,
    text: [
      buildPlainTextBody(textParagraphs, action),
      ...(footerLine ? [footerLine] : []),
    ].join('\n\n'),
  };
}
