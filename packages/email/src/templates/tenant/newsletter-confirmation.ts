import { renderEmailAction } from '@blog/email/html/email-action';
import {
  buildTenantShell,
  type TTenantEmailBrand,
} from '@blog/email/html/tenant-shell';

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
 * Builds the double opt-in newsletter confirmation email — subject, HTML and
 * `List-Unsubscribe` headers — rendered with the subscribing tenant's own
 * resolved brand. The confirm and unsubscribe links are rendered as two
 * locked actions outside the authored body, via `renderEmailAction`, so
 * neither can be displaced by future authored content.
 */
export function buildNewsletterConfirmationEmail({
  confirmationUrl,
  unsubscribeUrl,
  brand,
  brandName,
}: TNewsletterConfirmationEmailInput): TNewsletterConfirmationEmailContent {
  const bodyHtml = [
    '<p>Click the button below to confirm your newsletter subscription.</p>',
    '<p>If you did not request this, you can safely ignore this email.</p>',
  ].join('');

  const actionHtml = [
    renderEmailAction(
      {
        label: 'Confirm subscription',
        url: confirmationUrl,
        variant: 'button',
      },
      brand,
    ),
    renderEmailAction(
      { label: 'Unsubscribe', url: unsubscribeUrl, variant: 'link' },
      brand,
    ),
  ].join('');

  return {
    subject: 'Confirm your subscription',
    html: buildTenantShell({ brand, brandName, bodyHtml, actionHtml }),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}
