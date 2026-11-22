import {
  CELL_ROW_END,
  SHELL_WIDTH_PX,
} from '@shinefold/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';

export type TRenderEmailDocumentInput = {
  title: string;
  previewText?: string;
  css: string;
  pageColor: string;
  pageClassName: string;
  textColor: string;
  fontStack: string;
  contentPadding: string;
  contentClassName: string;
  blockGapPx: number;
  blocks: string[];
};

// Inbox preview text has no HTML tag; clients show the first visible text, so it hides in a zero-height div.
export function renderPreheader(previewText?: string): string {
  return previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(previewText)}</div>`
    : '';
}

export function renderEmailStack(blocks: string[], gapPx: number): string {
  const rows = blocks
    .filter(Boolean)
    .map(
      (block, index) =>
        `<tr><td style="padding:${index === 0 ? 0 : gapPx}px 0 0;">${block}${CELL_ROW_END}`,
    )
    .join('');

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>`;
}

export function renderEmailDocument({
  title,
  previewText,
  css,
  pageColor,
  pageClassName,
  textColor,
  fontStack,
  contentPadding,
  contentClassName,
  blockGapPx,
  blocks,
}: TRenderEmailDocumentInput): string {
  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    '<meta name="color-scheme" content="light dark" />',
    '<meta name="supported-color-schemes" content="light dark" />',
    `<title>${escapeHtml(title)}</title>`,
    `<style>${css}</style>`,
    '</head>',
    `<body class="${pageClassName}" style="margin:0;padding:0;background-color:${pageColor};font-family:${fontStack};">`,
    renderPreheader(previewText),
    `<table role="presentation" class="${pageClassName}" width="100%" cellpadding="0" cellspacing="0" bgcolor="${pageColor}" style="background-color:${pageColor};">`,
    '<tr><td align="center">',
    `<table role="presentation" width="${SHELL_WIDTH_PX}" cellpadding="0" cellspacing="0" style="max-width:${SHELL_WIDTH_PX}px;width:100%;">`,
    `<tr><td class="${contentClassName}" style="padding:${contentPadding};color:${textColor};font-family:${fontStack};">`,
    renderEmailStack(blocks, blockGapPx),
    CELL_ROW_END,
    '</table>',
    CELL_ROW_END,
    '</table>',
    '</body>',
    '</html>',
  ].join('');
}
