import { buildTenantShell, type TTenantEmailBrand } from '@blog/email';

export type TNewsletterConfirmationEmailInput = {
  confirmationUrl: string;
  unsubscribeUrl: string;
  brand: TTenantEmailBrand;
  brandName: string;
};

export type TNewsletterConfirmationEmailContent = {
  subject: string;
  html: string;
  headers: Record<string, string>;
};

/**
 * Builds the double opt-in newsletter confirmation email's content, rendered
 * with the subscribing tenant's own resolved brand via `buildTenantShell`.
 * `unsubscribeUrl` is required so no future newsletter send path can compile
 * without one — the whole point of a session-less unsubscribe link.
 */
export const buildNewsletterConfirmationEmail = ({
  confirmationUrl,
  unsubscribeUrl,
  brand,
  brandName,
}: TNewsletterConfirmationEmailInput): TNewsletterConfirmationEmailContent => {
  const bodyHtml = [
    `<p>Click the link below to confirm your newsletter subscription.</p>`,
    `<p><a href="${confirmationUrl}">Confirm subscription</a></p>`,
    `<p>If you did not request this, you can safely ignore this email.</p>`,
    `<p><a href="${unsubscribeUrl}">Unsubscribe</a></p>`,
  ].join('');

  return {
    subject: 'Confirm your subscription',
    html: buildTenantShell({ brand, brandName, bodyHtml }),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
};
