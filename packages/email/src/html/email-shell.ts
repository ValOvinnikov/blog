import { emailBrandTokens } from './brand-tokens';
import { escapeHtml } from './escape-html';

export type TEmailShellInput = {
  /** Displayed next to the mark in the header and in the footer's copyright line. */
  brandName: string;
  /** The inbox preview snippet shown alongside the subject line, before the email is opened. */
  previewText?: string;
  /** Already-assembled, already-escaped HTML for the message-specific content. */
  bodyHtml: string;
};

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/**
 * Wraps message-specific HTML in the shared branded email layout — logo
 * header, content card, footer — inlined for the mail clients that strip
 * `<style>` tags and don't support flexbox/grid, so every rule below is a
 * table cell attribute or an inline `style`, not a stylesheet.
 */
export function buildEmailShell({
  brandName,
  previewText,
  bodyHtml,
}: TEmailShellInput): string {
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
    `<body style="margin:0;padding:0;background-color:${emailBrandTokens.surface2};font-family:${FONT_STACK};">`,
    preheader,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${emailBrandTokens.surface2};">`,
    '<tr><td align="center" style="padding:32px 16px;">',
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${emailBrandTokens.surface};border:1px solid ${emailBrandTokens.border};border-radius:8px;">`,
    `<tr><td style="padding:24px 32px;border-bottom:1px solid ${emailBrandTokens.border};">`,
    buildBrandMark(escapedBrandName),
    '</td></tr>',
    `<tr><td style="padding:32px;color:${emailBrandTokens.text};font-family:${FONT_STACK};font-size:16px;line-height:1.5;">`,
    bodyHtml,
    '</td></tr>',
    `<tr><td style="padding:24px 32px;border-top:1px solid ${emailBrandTokens.border};color:${emailBrandTokens.textMuted};font-family:${FONT_STACK};font-size:12px;line-height:1.5;">`,
    `&copy; ${new Date().getFullYear()} ${escapedBrandName}`,
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body>',
    '</html>',
  ].join('');
}

function buildBrandMark(escapedBrandName: string): string {
  return [
    '<table role="presentation" cellpadding="0" cellspacing="0"><tr>',
    '<td style="padding-right:8px;">',
    '<svg width="24" height="24" viewBox="0 0 24 24" role="img" aria-hidden="true">',
    `<polygon points="12,3 22,7 12,11 2,7" fill="${emailBrandTokens.logo1}" />`,
    `<polygon points="12,8 22,12 12,16 2,12" fill="${emailBrandTokens.logo2}" />`,
    `<polygon points="12,13 22,17 12,21 2,17" fill="${emailBrandTokens.logo3}" />`,
    '</svg>',
    '</td>',
    `<td style="font-family:${FONT_STACK};font-size:18px;font-weight:700;color:${emailBrandTokens.text};">${escapedBrandName}</td>`,
    '</tr></table>',
  ].join('');
}
