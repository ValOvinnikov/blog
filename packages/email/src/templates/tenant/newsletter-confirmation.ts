import { renderEmailAction } from '@blog/email/html/email-action';
import {
  buildTenantShell,
  type TTenantEmailBrand,
} from '@blog/email/html/tenant-shell';
import {
  serializePortableText,
  type TPortableTextContent,
} from '@blog/email/portable-text';

export type TNewsletterConfirmationEmailInput = {
  subject: string;
  body: TPortableTextContent;
  confirmationUrl: string;
  unsubscribeUrl: string;
  brand: TTenantEmailBrand;
  brandName: string;
  logoImageUrl?: string;
  footerPostalAddress?: string;
};

export type TNewsletterConfirmationEmailContent = {
  subject: string;
  html: string;
  headers: Record<string, string>;
};

/**
 * Builds the double opt-in newsletter confirmation email — subject, HTML and
 * `List-Unsubscribe` headers — rendered with the subscribing tenant's own
 * resolved brand and resolved copy. The confirm and unsubscribe links are
 * rendered as two locked actions outside the authored body, via
 * `renderEmailAction`, so neither can be displaced by authored content.
 */
export function buildNewsletterConfirmationEmail({
  subject,
  body,
  confirmationUrl,
  unsubscribeUrl,
  brand,
  brandName,
  logoImageUrl,
  footerPostalAddress,
}: TNewsletterConfirmationEmailInput): TNewsletterConfirmationEmailContent {
  const bodyHtml = serializePortableText(body);

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
    subject,
    html: buildTenantShell({
      brand,
      brandName,
      bodyHtml,
      actionHtml,
      logoImageUrl,
      footerPostalAddress,
    }),
    headers: {
      'List-Unsubscribe': `<${unsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  };
}
