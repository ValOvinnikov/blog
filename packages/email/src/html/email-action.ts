import { FONT_STACK } from './email-layout';
import { escapeHtml } from './escape-html';
import { sanitizeHref } from './sanitize-href';

export type TEmailAction = {
  /** The visible action text — a tenant may relabel this, but this is the only part of the action they can change. */
  label: string;
  url: string;
  /** `button` (the default) for a primary call to action; `link` for a lower-emphasis action such as an unsubscribe. */
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

  return [
    '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px auto 0;">',
    '<tr>',
    `<td align="center" style="padding:12px 28px;border-radius:6px;background-color:${brand.brandPrimarySolid};">`,
    `<a href="${escapedUrl}" style="display:inline-block;font-family:${FONT_STACK};font-size:16px;font-weight:600;color:${brand.brandPrimaryContrast};text-decoration:none;">${escapedLabel}</a>`,
    '</td>',
    '</tr>',
    '</table>',
  ].join('');
}
