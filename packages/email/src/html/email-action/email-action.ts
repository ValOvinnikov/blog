import { renderEmailButton } from '@shinefold/email/html/email-button/email-button';
import { FONT_STACK } from '@shinefold/email/html/email-metrics/email-metrics';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { sanitizeHref } from '@shinefold/utils';

export type TEmailAction = {
  label: string;
  url: string;
  variant?: 'button' | 'link';
};

export type TEmailLink = Omit<TEmailAction, 'variant'>;

export type TEmailActionBrand = {
  brandPrimary: string;
  brandPrimarySolid: string;
  brandPrimaryContrast: string;
};

/** The locked action rendered outside the authored body, so authored content cannot remove or replace it. */
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

  return renderEmailButton({
    label: action.label,
    url: action.url,
    fill: brand.brandPrimarySolid,
    textColor: brand.brandPrimaryContrast,
    fontStack: FONT_STACK,
    fontSizePx: 16,
    radiusPx: 6,
    paddingYPx: 12,
    paddingXPx: 28,
    tableStyle: 'margin:24px auto 0;',
  });
}
