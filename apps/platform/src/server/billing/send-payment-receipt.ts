import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import { fromStripeTime } from '@platform/server/billing/stripe-time';
import { loadOwnerEmailRecipient } from '@platform/server/owner-email/load-owner-email-recipient';
import { formatDate } from '@platform/utils/format-date/format-date';
import { formatStripeAmount } from '@shinefold/config';
import { EMAIL_ACCOUNT, type TTenantPlan } from '@shinefold/config/constants';
import {
  buildOwnerReceiptEmail,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
} from '@shinefold/email';
import { getTranslations } from 'next-intl/server';
import type Stripe from 'stripe';

export const sendPaymentReceipt = async (
  stripe: Stripe,
  invoiceId: string,
  tenantId: string,
  plan: TTenantPlan,
): Promise<void> => {
  const owner = await loadOwnerEmailRecipient(tenantId, {
    unconfigured: BILLING_LOG.RECEIPT_UNCONFIGURED,
    ownerMissing: BILLING_LOG.RECEIPT_OWNER_MISSING,
  });
  if (!owner) return;

  const invoice = await stripe.invoices.retrieve(invoiceId);
  const { amount_paid, currency, invoice_pdf, hosted_invoice_url } = invoice;
  if (amount_paid === 0) return;
  const invoiceUrl = invoice_pdf ?? hosted_invoice_url;
  if (!invoiceUrl) {
    throw new Error(`sendPaymentReceipt: invoice "${invoiceId}" has no link.`);
  }

  const {
    from,
    ownerEmail,
    tenant: { locale, name: siteName },
  } = owner;
  const [t, tPlan] = await Promise.all([
    getTranslations({ locale, namespace: 'ownerReceiptEmail' }),
    getTranslations({ locale, namespace: 'planNames' }),
  ]);
  const amount = formatStripeAmount(
    { minorUnits: amount_paid, currency },
    locale,
  );
  const paidAt = invoice.status_transitions.paid_at ?? invoice.created;
  const values = { siteName, amount };

  await sendEmail({
    account: EMAIL_ACCOUNT.PLATFORM,
    to: ownerEmail,
    from,
    ...buildOwnerReceiptEmail({
      brandName: PLATFORM_EMAIL_BRAND_NAME,
      subject: t('subject', values),
      previewText: t('previewText', values),
      paragraphs: [t('thanks', values)],
      details: [
        { label: t('amountLabel'), value: amount },
        {
          label: t('dateLabel'),
          value: formatDate(fromStripeTime(paidAt), locale),
        },
        { label: t('planLabel'), value: tPlan(plan) },
      ],
      action: { label: t('actionLabel'), url: invoiceUrl },
    }),
  });
};
