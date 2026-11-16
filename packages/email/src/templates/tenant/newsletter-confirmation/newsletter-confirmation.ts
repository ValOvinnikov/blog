import type { TTenantEmailBrand } from '@shinefold/config';
import { renderEmailAction } from '@shinefold/email/html/email-action/email-action';
import { buildTenantShell } from '@shinefold/email/html/tenant-shell/tenant-shell';
import {
  serializePortableText,
  type TPortableTextContent,
} from '@shinefold/email/portable-text';
import {
  buildListUnsubscribeHeaders,
  buildUnsubscribeAction,
} from '@shinefold/email/templates/tenant/unsubscribe/unsubscribe';

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
    renderEmailAction(buildUnsubscribeAction(unsubscribeUrl), brand),
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
