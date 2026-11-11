import { renderEmailAction } from '@blog/email/html/email-action/email-action';
import {
  buildTenantShell,
  type TTenantEmailBrand,
} from '@blog/email/html/tenant-shell/tenant-shell';
import {
  serializePortableText,
  type TPortableTextContent,
} from '@blog/email/portable-text';
import { buildListUnsubscribeHeaders } from '@blog/email/templates/tenant/list-unsubscribe-headers/list-unsubscribe-headers';

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
    headers: buildListUnsubscribeHeaders(unsubscribeUrl),
  };
}
