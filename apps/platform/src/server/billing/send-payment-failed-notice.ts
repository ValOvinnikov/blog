import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import { fromStripeTime } from '@platform/server/billing/stripe-time';
import { loadOwnerEmailRecipient } from '@platform/server/owner-email/load-owner-email-recipient';
import { env } from '@platform/utils/env/env';
import { formatDate } from '@platform/utils/format-date/format-date';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { formatStripeAmount } from '@shinefold/config';
import { EMAIL_ACCOUNT, type TTenantPlan } from '@shinefold/config/constants';
import {
  buildOwnerPaymentFailedEmail,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
} from '@shinefold/email';
import { getTranslations } from 'next-intl/server';
import type Stripe from 'stripe';

export const sendPaymentFailedNotice = async (
  invoice: Stripe.Invoice,
  tenantId: string,
  plan: TTenantPlan,
): Promise<void> => {
  const baseUrl = env.PLATFORM_APP_BASE_URL;
  if (!baseUrl) {
    logger.warn(BILLING_LOG.PAYMENT_FAILED_EMAIL_UNCONFIGURED, { tenantId });
    return;
  }

  const owner = await loadOwnerEmailRecipient(tenantId, {
    unconfigured: BILLING_LOG.PAYMENT_FAILED_EMAIL_UNCONFIGURED,
    ownerMissing: BILLING_LOG.PAYMENT_FAILED_EMAIL_OWNER_MISSING,
  });
  if (!owner) return;

  const {
    from,
    ownerEmail,
    tenant: { locale, name: siteName },
  } = owner;
  const { amount_due, currency, next_payment_attempt, hosted_invoice_url } =
    invoice;
  const [t, tPlan] = await Promise.all([
    getTranslations({ locale, namespace: 'ownerPaymentFailedEmail' }),
    getTranslations({ locale, namespace: 'planNames' }),
  ]);
  const amount = formatStripeAmount(
    { minorUnits: amount_due, currency },
    locale,
  );
  const values = { siteName, amount };

  await sendEmail({
    account: EMAIL_ACCOUNT.PLATFORM,
    to: ownerEmail,
    from,
    ...buildOwnerPaymentFailedEmail({
      brandName: PLATFORM_EMAIL_BRAND_NAME,
      subject: t('subject', values),
      previewText: t('previewText', values),
      paragraphs: [t('failed', values), t('payInvoice')],
      details: [
        { label: t('amountLabel'), value: amount },
        { label: t('planLabel'), value: tPlan(plan) },
      ],
      nextRetry: next_payment_attempt
        ? {
            label: t('nextRetryLabel'),
            value: formatDate(fromStripeTime(next_payment_attempt), locale),
          }
        : undefined,
      planEndingNotice: t('planEnding'),
      action: {
        label: t('actionLabel'),
        url:
          hosted_invoice_url ??
          new URL(adminRoutes.dashboardBilling(), baseUrl).toString(),
      },
    }),
  });
};
