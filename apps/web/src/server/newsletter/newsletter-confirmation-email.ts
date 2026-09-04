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
 * buildNewsletterConfirmationEmail — the double opt-in confirmation email's
 * content, sent via `@blog/email`'s `sendEmail` from
 * `subscribeToNewsletterAction`. Pure and framework-free so it's testable
 * without mocking Resend, mirroring `buildMagicLinkEmail`'s shape. Rendered
 * with the subscribing tenant's own resolved brand via `buildTenantShell` —
 * the subject and body copy stay hardcoded until tenant-authored copy ships.
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
