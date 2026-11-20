import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { sanitizeHref } from '@shinefold/utils';

export type TEmailButton = {
  label: string;
  url: string;
  fill: string;
  textColor: string;
  fontStack: string;
  fontSizePx: number;
  radiusPx: number;
  paddingYPx: number;
  paddingXPx: number;
  tableStyle?: string;
  className?: string;
};

const BUTTON_BORDER_PX = 1;

export function renderEmailButton({
  label,
  url,
  fill,
  textColor,
  fontStack,
  fontSizePx,
  radiusPx,
  paddingYPx,
  paddingXPx,
  tableStyle,
  className,
}: TEmailButton): string {
  const escapedUrl = escapeHtml(sanitizeHref(url) ?? '#');
  const classAttribute = className ? ` class="${className}"` : '';
  const styleAttribute = tableStyle ? ` style="${tableStyle}"` : '';

  // The anchor carries the padding so the whole button is clickable; the cell's fill covers Outlook desktop, which drops padding on links.
  return [
    `<table role="presentation" cellpadding="0" cellspacing="0"${styleAttribute}>`,
    '<tr>',
    `<td${classAttribute} align="center" bgcolor="${fill}" style="border-radius:${radiusPx}px;background-color:${fill};">`,
    `<a${classAttribute} href="${escapedUrl}" style="display:inline-block;padding:${paddingYPx - BUTTON_BORDER_PX}px ${paddingXPx - BUTTON_BORDER_PX}px;border:${BUTTON_BORDER_PX}px solid ${fill};border-radius:${radiusPx}px;background-color:${fill};font-family:${fontStack};font-size:${fontSizePx}px;font-weight:600;color:${textColor};text-decoration:none;">${escapeHtml(label)}</a>`,
    '</td>',
    '</tr>',
    '</table>',
  ].join('');
}
