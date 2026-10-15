import { renderEmailAction } from '@blog/email/html/email-action/email-action';
import { escapeHtml } from '@blog/email/html/escape-html/escape-html';
import {
  buildTenantShell,
  type TTenantEmailBrand,
} from '@blog/email/html/tenant-shell/tenant-shell';
import { sanitizeHref } from '@blog/utils';

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

function renderMessageQuote(message: string, brand: TTenantEmailBrand): string {
  const messageHtml = escapeHtml(message).replace(/\r\n|\r|\n/g, '<br />');

  return `<blockquote style="margin:0 0 16px;padding:12px 16px;border-left:3px solid ${brand.border};background-color:${brand.surface2};color:${brand.text};">${messageHtml}</blockquote>`;
}

/**
 * The site owner's notice of a contact form message. The caller sends it with
 * `replyTo` set to the visitor, which is what makes the reply line true.
 */
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
    renderMessageQuote(message, brand),
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
