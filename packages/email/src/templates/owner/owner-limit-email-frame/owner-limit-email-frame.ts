import { renderDarkModeCss } from '@shinefold/email/html/email-css/email-css';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import {
  PLATFORM_EMAIL_BRAND,
  PLATFORM_EMAIL_DARK_BRAND,
} from '@shinefold/email/html/platform-email-brand/platform-email-brand';

export const OWNER_PAGE_CLASS = 'oe-page';
export const OWNER_CARD_CLASS = 'oe-card';
export const OWNER_TEXT_CLASS = 'oe-text';
export const OWNER_MUTED_CLASS = 'oe-muted';
export const OWNER_BOX_CLASS = 'oe-box';
export const OWNER_TRACK_CLASS = 'oe-track';
export const OWNER_WARN_CLASS = 'oe-warn';
export const OWNER_BAD_CLASS = 'oe-bad';
export const OWNER_MUTED_FILL_CLASS = 'oe-muted-fill';
export const OWNER_WARN_FILL_CLASS = 'oe-warn-fill';
export const OWNER_BAD_FILL_CLASS = 'oe-bad-fill';

export function renderOwnerWordmark(brandName: string): string {
  return `<div class="${OWNER_TEXT_CLASS}" style="padding-top:4px;font-size:18px;font-weight:700;letter-spacing:-0.01em;color:${PLATFORM_EMAIL_BRAND.text};">${escapeHtml(brandName)}</div>`;
}

export function renderOwnerFooter(footerLine?: string): string {
  if (!footerLine) return '';

  return `<p class="${OWNER_MUTED_CLASS}" style="margin:0;text-align:center;font-size:12px;line-height:1.6;color:${PLATFORM_EMAIL_BRAND.textMuted};">${escapeHtml(footerLine)}</p>`;
}

export function renderOwnerLimitEmailCss(): string {
  const { surface, surface2, border, text, textMuted, surfaceHead, warn, bad } =
    PLATFORM_EMAIL_DARK_BRAND;

  return renderDarkModeCss({
    [OWNER_PAGE_CLASS]: { 'background-color': surface2 },
    [OWNER_CARD_CLASS]: { 'background-color': surface, 'border-color': border },
    [OWNER_TEXT_CLASS]: { color: text },
    [OWNER_MUTED_CLASS]: { color: textMuted },
    [OWNER_BOX_CLASS]: { 'background-color': surfaceHead },
    [OWNER_TRACK_CLASS]: { 'background-color': border },
    [OWNER_WARN_CLASS]: { color: warn },
    [OWNER_BAD_CLASS]: { color: bad },
    [OWNER_MUTED_FILL_CLASS]: { 'background-color': textMuted },
    [OWNER_WARN_FILL_CLASS]: { 'background-color': warn },
    [OWNER_BAD_FILL_CLASS]: { 'background-color': bad },
  });
}
