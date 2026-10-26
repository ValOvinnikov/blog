import { FONT_STACK } from '@blog/email/html/email-layout/email-layout';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import { sanitizeHref } from '@blog/utils';

export type TEmailAction = {
  label: string;
  url: string;
  variant?: 'button' | 'link';
};

export type TEmailActionBrand = {
  brandPrimary: string;
  brandPrimarySolid: string;
  brandPrimaryContrast: string;
};

/**
 * Renders the one interactive element a transactional email carries — a
 * sign-in button, an invite-accept button, an unsubscribe link — in the
 * given brand's colours. Callers build this independently of the authored
 * body, so no authored content can remove or replace it.
 */
export function renderEmailAction(
  action: TEmailAction,
  brand: TEmailActionBrand,
): string {
  const escapedLabel = escapeHtml(action.label);
  const escapedUrl = escapeHtml(sanitizeHref(action.url) ?? '#');

  if (action.variant === 'link') {
    return [
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0">',
      '<tr><td align="center" style="padding-top:8px;">',
      `<a href="${escapedUrl}" style="font-family:${FONT_STACK};font-size:14px;color:${brand.brandPrimary};text-decoration:underline;">${escapedLabel}</a>`,
      '</td></tr>',
      '</table>',
    ].join('');
  }

  // The anchor carries the padding so the whole button is clickable; the cell's fill covers Outlook desktop, which drops padding on links.
  return [
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">',
    '<tr>',
    `<td align="center" bgcolor="${brand.brandPrimarySolid}" style="border-radius:6px;background-color:${brand.brandPrimarySolid};">`,
    `<a href="${escapedUrl}" style="display:inline-block;padding:11px 27px;border:1px solid ${brand.brandPrimarySolid};border-radius:6px;background-color:${brand.brandPrimarySolid};font-family:${FONT_STACK};font-size:16px;font-weight:600;color:${brand.brandPrimaryContrast};text-decoration:none;">${escapedLabel}</a>`,
    '</td>',
    '</tr>',
    '</table>',
  ].join('');
}
