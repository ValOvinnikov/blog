import { escapeHtml } from './escape-html';

type TEmailPalette = {
  surface: string;
  surface2: string;
  border: string;
  text: string;
  textMuted: string;
  logo1: string;
  logo2: string;
  logo3: string;
};

export type TRenderEmailShellInput = {
  palette: TEmailPalette;
  brandName: string;
  previewText?: string;
  bodyHtml: string;
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Wraps message-specific HTML in the branded email layout — logo header,
 * content card, footer — inlined for the mail clients that strip `<style>`
 * tags and don't support flexbox/grid, so every rule below is a table cell
 * attribute or an inline `style`, not a stylesheet. Shared by both shell
 * builders; the palette is the only thing that differs between them.
 */
export function renderEmailShell({
  palette,
  brandName,
  previewText,
  bodyHtml,
}: TRenderEmailShellInput): string {
  const escapedBrandName = escapeHtml(brandName);
  const preheader = previewText
    ? // Inbox preview text has no dedicated HTML tag — clients fall back to
      // the first visible text, so a hidden, zero-height span is the
      // standard way to control what shows next to the subject line.
      `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>`
    : '';

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapedBrandName}</title>`,
    '</head>',
    `<body style="margin:0;padding:0;background-color:${palette.surface2};font-family:${FONT_STACK};">`,
    preheader,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${palette.surface2};">`,
    '<tr><td align="center" style="padding:32px 16px;">',
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${palette.surface};border:1px solid ${palette.border};border-radius:8px;">`,
    `<tr><td style="padding:24px 32px;border-bottom:1px solid ${palette.border};">`,
    buildBrandMark(palette, escapedBrandName),
    '</td></tr>',
    `<tr><td style="padding:32px;color:${palette.text};font-family:${FONT_STACK};font-size:16px;line-height:1.5;">`,
    bodyHtml,
    '</td></tr>',
    `<tr><td style="padding:24px 32px;border-top:1px solid ${palette.border};color:${palette.textMuted};font-family:${FONT_STACK};font-size:12px;line-height:1.5;">`,
    `&copy; ${new Date().getFullYear()} ${escapedBrandName}`,
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body>',
    '</html>',
  ].join('');
}

function buildBrandMark(
  palette: TEmailPalette,
  escapedBrandName: string,
): string {
  return [
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>',
    '<td style="padding-right:8px;">',
    '<svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true">',
    `<polygon points="12,3 22,7 12,11 2,7" fill="${palette.logo1}" />`,
    `<polygon points="12,8 22,12 12,16 2,12" fill="${palette.logo2}" />`,
    `<polygon points="12,13 22,17 12,21 2,17" fill="${palette.logo3}" />`,
    '</svg>',
    '</td>',
    `<td style="font-family:${FONT_STACK};font-size:18px;font-weight:700;color:${palette.text};">${escapedBrandName}</td>`,
    '</tr></table>',
  ].join('');
}
