import { buildTenantShell, type TTenantEmailBrand } from '@blog/email';

export type TNewsletterConfirmationEmailInput = {
  confirmationUrl: string;
  brand: TTenantEmailBrand;
  brandName: string;
};

export type TNewsletterConfirmationEmailContent = {
  subject: string;
  html: string;
};

/**
 * Builds the double opt-in newsletter confirmation email's content, rendered
 * with the subscribing tenant's own resolved brand via `buildTenantShell`.
 */
export const buildNewsletterConfirmationEmail = ({
  confirmationUrl,
  brand,
  brandName,
}: TNewsletterConfirmationEmailInput): TNewsletterConfirmationEmailContent => {
  const bodyHtml = [
    `<p>Click the link below to confirm your newsletter subscription.</p>`,
    `<p><a href="${confirmationUrl}">Confirm subscription</a></p>`,
    `<p>If you did not request this, you can safely ignore this email.</p>`,
  ].join('');

  return {
    subject: 'Confirm your subscription',
    html: buildTenantShell({ brand, brandName, bodyHtml }),
  };
};
