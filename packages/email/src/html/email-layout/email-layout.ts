import {
  FONT_STACK,
  SHELL_PADDING_PX,
  SHELL_WIDTH_PX,
} from '@blog/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { sanitizeImageUrl } from '@blog/email/html/sanitize-image-url/sanitize-image-url';
import { hasLength } from '@blog/utils/primitives';

type TEmailPalette = {
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
};

type TEmailMarkPalette = {
  logo1: string;
  logo2: string;
  logo3: string;
};

type TEmailShellIdentity = {
  brandName: string;
  markPalette: TEmailMarkPalette;
  logoImageUrl?: string;
};

export type TRenderEmailShellInput = {
  palette: TEmailPalette;
  title: string;
  identity?: TEmailShellIdentity;
  previewText?: string;
  bodyHtml: string;
  structuralHtml?: string;
  actionHtml?: string;
  footerPostalAddress?: string;
};

const CELL_ROW_END = '</td></tr>';

// Every rule is an inline style or table attribute: many mail clients strip `<style>` and ignore flexbox/grid.
export function renderEmailShell({
  palette,
  title,
  identity,
  previewText,
  bodyHtml,
  structuralHtml,
  actionHtml,
  footerPostalAddress,
}: TRenderEmailShellInput): string {
  const lockedHtml = `${structuralHtml ?? ''}${actionHtml ?? ''}`;
  // Inbox preview text has no HTML tag; clients show the first visible text, so it hides in a zero-height div.
  const preheader = previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>`
    : '';

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    '</head>',
    `<body style="margin:0;padding:0;background-color:${palette.surface2};font-family:${FONT_STACK};">`,
    preheader,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${palette.surface2};">`,
    '<tr><td align="center" style="padding:32px 16px;">',
    `<table role="presentation" width="${SHELL_WIDTH_PX}" cellpadding="0" cellspacing="0" style="max-width:${SHELL_WIDTH_PX}px;width:100%;background-color:${palette.surface};border:1px solid ${palette.border};border-radius:8px;">`,
    identity ? buildHeader(palette, identity) : '',
    `<tr><td style="padding:${SHELL_PADDING_PX}px;color:${palette.text};font-family:${FONT_STACK};font-size:16px;line-height:1.5;">`,
    bodyHtml,
    CELL_ROW_END,
    lockedHtml
      ? `<tr><td style="padding:0 32px 32px;">${lockedHtml}</td></tr>`
      : '',
    buildFooter(palette, identity?.brandName, footerPostalAddress),
    '</table>',
    CELL_ROW_END,
    '</table>',
    '</body>',
    '</html>',
  ].join('');
}

function buildHeader(
  palette: TEmailPalette,
  { brandName, markPalette, logoImageUrl }: TEmailShellIdentity,
): string {
  const escapedBrandName = escapeHtml(brandName);
  const sanitizedLogoUrl = logoImageUrl ? sanitizeImageUrl(logoImageUrl) : null;

  const mark = sanitizedLogoUrl
    ? `<img src="${escapeHtml(sanitizedLogoUrl)}" width="32" height="32" alt="${escapedBrandName} logo" style="display:block;width:32px;height:32px;border:0;" />`
    : [
        '<svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true">',
        `<polygon points="12,3 22,7 12,11 2,7" fill="${markPalette.logo1}" />`,
        `<polygon points="12,8 22,12 12,16 2,12" fill="${markPalette.logo2}" />`,
        `<polygon points="12,13 22,17 12,21 2,17" fill="${markPalette.logo3}" />`,
        '</svg>',
      ].join('');

  return [
    `<tr><td style="padding:24px 32px;border-bottom:1px solid ${palette.border};">`,
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>',
    '<td style="padding-right:8px;">',
    mark,
    '</td>',
    `<td style="font-family:${FONT_STACK};font-size:18px;font-weight:700;color:${palette.text};">${escapedBrandName}</td>`,
    '</tr></table>',
    CELL_ROW_END,
  ].join('');
}

function buildFooter(
  palette: TEmailPalette,
  brandName?: string,
  footerPostalAddress?: string,
): string {
  const lines = [
    brandName
      ? `&copy; ${new Date().getFullYear()} ${escapeHtml(brandName)}`
      : '',
    footerPostalAddress ? escapeHtml(footerPostalAddress) : '',
  ].filter(Boolean);

  if (!hasLength(lines)) return '';

  return [
    `<tr><td style="padding:24px 32px;border-top:1px solid ${palette.border};color:${palette.textMuted};font-family:${FONT_STACK};font-size:12px;line-height:1.5;">`,
    lines.join('<br />'),
    CELL_ROW_END,
  ].join('');
}
