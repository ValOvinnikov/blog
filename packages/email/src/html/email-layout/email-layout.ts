import {
  renderEmailHeader,
  type TEmailHeaderLogo,
} from '@blog/email/html/email-header/email-header';
import {
  CELL_ROW_END,
  FONT_STACK,
  SHELL_PADDING_PX,
  SHELL_WIDTH_PX,
} from '@blog/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { hasLength } from '@blog/utils/primitives';

type TEmailPalette = {
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
};

type TEmailShellIdentity = {
  brandName: string;
  logo: TEmailHeaderLogo;
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
    identity
      ? renderEmailHeader(palette, identity.brandName, identity.logo)
      : '',
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
