export type TNewsletterConfirmationEmailInput = {
  confirmationUrl: string;
};

export type TNewsletterConfirmationEmailContent = {
  subject: string;
  html: string;
};

/**
 * buildNewsletterConfirmationEmail — the double opt-in confirmation email's
 * HTML content, sent via `@web/server/email/send-email` from
 * `subscribeToNewsletterAction`. Pure and framework-free so it's testable
 * without mocking Resend, mirroring `buildMagicLinkEmail`'s shape.
 */
export function buildNewsletterConfirmationEmail({
  confirmationUrl,
}: TNewsletterConfirmationEmailInput): TNewsletterConfirmationEmailContent {
  return {
    subject: 'Confirm your subscription',
    html: [
      `<p>Click the link below to confirm your newsletter subscription.</p>`,
      `<p><a href="${confirmationUrl}">Confirm subscription</a></p>`,
      `<p>If you did not request this, you can safely ignore this email.</p>`,
    ].join(''),
  };
}
