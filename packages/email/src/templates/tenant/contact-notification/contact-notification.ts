import type { TTenantEmailBrand } from '@shinefold/config';
import { renderEmailAction } from '@shinefold/email/html/email-action/email-action';
import { renderEmailMessageQuote } from '@shinefold/email/html/email-message-quote/email-message-quote';
import { escapeHtml } from '@shinefold/email/html/escape-html/escape-html';
import { buildTenantShell } from '@shinefold/email/html/tenant-shell/tenant-shell';
import { sanitizeHref } from '@shinefold/utils';

export type TContactNotificationEmailInput = {
  siteName: string;
  visitorName: string;
  visitorEmail: string;
  message: string;
  pageUrl: string;
  leadsUrl: string;
  brand: TTenantEmailBrand;
  logoImageUrl?: string;
  footerPostalAddress?: string;
};

export type TContactNotificationEmailContent = {
  subject: string;
  html: string;
};

function renderPageLink(pageUrl: string): string {
  const escapedLabel = escapeHtml(pageUrl);
  const safeHref = sanitizeHref(pageUrl);

  return safeHref
    ? `<a href="${escapeHtml(safeHref)}" style="color:inherit;text-decoration:underline;">${escapedLabel}</a>`
    : escapedLabel;
}

/** Send it with `replyTo` set to the visitor, or its "reply to this email" line is false. */
export function buildContactNotificationEmail({
  siteName,
  visitorName,
  visitorEmail,
  message,
  pageUrl,
  leadsUrl,
  brand,
  logoImageUrl,
  footerPostalAddress,
}: TContactNotificationEmailInput): TContactNotificationEmailContent {
  const escapedVisitorName = escapeHtml(visitorName);

  const bodyHtml = [
    `<p style="margin:0 0 16px;"><strong>${escapedVisitorName}</strong> (${escapeHtml(visitorEmail)}) sent a message from ${renderPageLink(pageUrl)}.</p>`,
    renderEmailMessageQuote(message, brand),
    `<p style="margin:0;color:${brand.textMuted};">Reply to this email to answer ${escapedVisitorName} directly.</p>`,
  ].join('');

  return {
    subject: `New message from ${visitorName}`,
    html: buildTenantShell({
      brand,
      brandName: siteName,
      previewText: `${visitorName} sent a message through ${siteName}`,
      bodyHtml,
      actionHtml: renderEmailAction(
        { label: 'View all leads', url: leadsUrl, variant: 'button' },
        brand,
      ),
      logoImageUrl,
      footerPostalAddress,
    }),
  };
}
