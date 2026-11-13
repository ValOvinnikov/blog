import 'server-only';

import { LOCALE_BCP47_TAGS } from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { queries } from '@blog/db';
import {
  buildOwnerReceiptEmail,
  EMAIL_ACCOUNT,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
} from '@blog/email';
import {
  BILLING_LOG,
  MILLISECONDS_PER_SECOND,
} from '@platform/constants/billing';
import { env } from '@platform/utils/env/env';
import { formatDate } from '@platform/utils/format-date/format-date';
import { logger } from '@platform/utils/logger/logger';
import { getTranslations } from 'next-intl/server';
import type Stripe from 'stripe';

const MINOR_UNITS_PER_MAJOR = 100;

export const sendPaymentReceipt = async (
  stripe: Stripe,
  invoiceId: string,
  tenantId: string,
  plan: TTenantPlan,
): Promise<void> => {
  const from = env.OWNER_EMAIL_FROM_ADDRESS;
  if (!from) {
    logger.warn(BILLING_LOG.RECEIPT_UNCONFIGURED, { tenantId });
    return;
  }

  const [tenant, ownerEmail, invoice] = await Promise.all([
    queries.tenants.getTenantById(tenantId),
    queries.memberships.getTenantOwnerEmail(tenantId),
    stripe.invoices.retrieve(invoiceId),
  ]);
  if (!tenant || !ownerEmail) {
    logger.warn(BILLING_LOG.RECEIPT_OWNER_MISSING, { tenantId });
    return;
  }

  const { amount_paid, currency, invoice_pdf, hosted_invoice_url } = invoice;
  if (amount_paid === 0) return;
  const invoiceUrl = invoice_pdf ?? hosted_invoice_url;
  if (!invoiceUrl) {
    throw new Error(`sendPaymentReceipt: invoice "${invoiceId}" has no link.`);
  }

  const { locale, name: siteName } = tenant;
  const [t, tPlan] = await Promise.all([
    getTranslations({ locale, namespace: 'ownerReceiptEmail' }),
    getTranslations({ locale, namespace: 'planNames' }),
  ]);
  const amount = new Intl.NumberFormat(LOCALE_BCP47_TAGS[locale], {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount_paid / MINOR_UNITS_PER_MAJOR);
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
          value: formatDate(new Date(paidAt * MILLISECONDS_PER_SECOND), locale),
        },
        { label: t('planLabel'), value: tPlan(plan) },
      ],
      action: { label: t('actionLabel'), url: invoiceUrl },
    }),
  });
};
