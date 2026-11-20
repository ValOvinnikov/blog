import type { TTenantEmailBrand } from '@shinefold/config';
import {
  EMAIL_FONT_STACK,
  type TFontChoice,
} from '@shinefold/config/constants';
import type { TEmailAction } from '@shinefold/email/html/email-action/email-action';
import {
  renderDarkModeCss,
  renderNarrowScreenCss,
} from '@shinefold/email/html/email-css/email-css';
import { FONT_STACK } from '@shinefold/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { sanitizeImageUrl } from '@shinefold/email/html/sanitize-image-url/sanitize-image-url';
import { sanitizeHref } from '@shinefold/utils';
import { SHINEFOLD_LOGO_COLOR } from '@shinefold/utils/shinefold-logo';

export type TPostEmailFonts = { heading: string; body: string };

export const POST_PAGE_CLASS = 'pe-page';
export const POST_CONTENT_CLASS = 'pe-content';
export const POST_CARD_CLASS = 'pe-card';
export const POST_COVER_CLASS = 'pe-cover';
export const POST_INNER_CLASS = 'pe-inner';
export const POST_TITLE_CLASS = 'pe-title';
export const POST_TEXT_CLASS = 'pe-text';
export const POST_ACCENT_CLASS = 'pe-accent';
export const POST_BOX_CLASS = 'pe-box';
export const POST_BUTTON_CLASS = 'pe-button';
const POST_MUTED_CLASS = 'pe-muted';
const POST_BANNER_CLASS = 'pe-banner';

export const POST_PAGE_PADDING_X_PX = 40;
const LOGO_SIZE_PX = 32;
const TEST_BANNER_LIGHT = { fill: '#fff1c2', text: SHINEFOLD_LOGO_COLOR.INK };
const TEST_BANNER_DARK = { fill: '#33290d', text: '#ffe08a' };

export function resolvePostEmailFonts(
  headingFont?: TFontChoice,
  bodyFont?: TFontChoice,
): TPostEmailFonts {
  return {
    heading: headingFont ? EMAIL_FONT_STACK[headingFont] : FONT_STACK,
    body: bodyFont ? EMAIL_FONT_STACK[bodyFont] : FONT_STACK,
  };
}

export function renderTestBanner(text: string): string {
  return `<div class="${POST_BANNER_CLASS}" style="padding:10px 14px;border-radius:8px;background-color:${TEST_BANNER_LIGHT.fill};color:${TEST_BANNER_LIGHT.text};font-size:13px;font-weight:600;line-height:1.4;">${escapeHtml(text)}</div>`;
}

export function renderSiteName(
  brandName: string,
  brand: TTenantEmailBrand,
  fonts: TPostEmailFonts,
  logoImageUrl?: string,
): string {
  const safeLogoUrl = logoImageUrl ? sanitizeImageUrl(logoImageUrl) : null;
  const logo = safeLogoUrl
    ? `<img src="${escapeHtml(safeLogoUrl)}" width="${LOGO_SIZE_PX}" height="${LOGO_SIZE_PX}" alt="" style="display:block;margin:0 auto 8px;width:${LOGO_SIZE_PX}px;height:${LOGO_SIZE_PX}px;border:0;" />`
    : '';

  return `<div class="${POST_TEXT_CLASS}" style="padding:8px 0;text-align:center;font-family:${fonts.heading};font-size:20px;font-weight:600;color:${brand.text};">${logo}${escapeHtml(brandName)}</div>`;
}

export function renderPostFooter(
  footerLine: string,
  { label, url }: TEmailAction,
  brand: TTenantEmailBrand,
  footerPostalAddress?: string,
): string {
  const lines = [
    escapeHtml(footerLine),
    `<a class="${POST_MUTED_CLASS}" href="${escapeHtml(sanitizeHref(url) ?? '#')}" style="color:${brand.textMuted};text-decoration:underline;">${escapeHtml(label)}</a>`,
    footerPostalAddress ? escapeHtml(footerPostalAddress) : '',
  ].filter(Boolean);

  return `<p class="${POST_MUTED_CLASS}" style="margin:0;padding:8px 12px;text-align:center;font-size:13px;line-height:1.6;color:${brand.textMuted};">${lines.join('<br />')}</p>`;
}

function darkBrandRules(darkBrand: TTenantEmailBrand) {
  return {
    [POST_PAGE_CLASS]: { 'background-color': darkBrand.surface2 },
    [POST_CARD_CLASS]: {
      'background-color': darkBrand.surface,
      'border-color': darkBrand.border,
    },
    [POST_BOX_CLASS]: { 'border-color': darkBrand.border },
    [POST_TEXT_CLASS]: { color: darkBrand.text },
    [POST_MUTED_CLASS]: { color: darkBrand.textMuted },
    [POST_ACCENT_CLASS]: { color: darkBrand.brandPrimary },
    [POST_BUTTON_CLASS]: {
      'background-color': darkBrand.brandPrimarySolid,
      'border-color': darkBrand.brandPrimarySolid,
      color: darkBrand.brandPrimaryContrast,
    },
  };
}

export function renderPostEmailCss(darkBrand?: TTenantEmailBrand): string {
  return [
    renderNarrowScreenCss({
      [POST_CONTENT_CLASS]: { padding: '16px 12px' },
      [POST_COVER_CLASS]: { height: '200px' },
      [POST_INNER_CLASS]: { padding: '22px 18px 24px' },
      [POST_TITLE_CLASS]: { 'font-size': '28px' },
    }),
    renderDarkModeCss({
      ...(darkBrand ? darkBrandRules(darkBrand) : {}),
      [POST_BANNER_CLASS]: {
        'background-color': TEST_BANNER_DARK.fill,
        color: TEST_BANNER_DARK.text,
      },
    }),
  ].join('');
}
