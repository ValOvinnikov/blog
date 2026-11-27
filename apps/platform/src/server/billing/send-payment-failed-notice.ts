import 'server-only';

import { BILLING_LOG } from '@platform/constants/billing';
import { PAYMENT_FAILURE } from '@platform/constants/stripe-payment';
import { fromStripeTime } from '@platform/server/billing/stripe-time';
import { loadOwnerEmailRecipient } from '@platform/server/owner-email/load-owner-email-recipient';
import { env } from '@platform/utils/env/env';
import { formatDate } from '@platform/utils/format-date/format-date';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { formatStripeAmount } from '@shinefold/config';
import { EMAIL_ACCOUNT, type TTenantPlan } from '@shinefold/config/constants';
import type { TValueOf } from '@shinefold/config/utils';
import {
  buildOwnerPaymentFailedEmail,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
} from '@shinefold/email';
import { getTranslations } from 'next-intl/server';
import type Stripe from 'stripe';

const FAILURE_COPY = {
  [PAYMENT_FAILURE.DECLINED]: {
    subject: 'subject',
    previewText: 'previewText',
    failed: 'failed',
    nextStep: 'payInvoice',
    actionLabel: 'actionLabel',
  },
  [PAYMENT_FAILURE.AUTHENTICATION_REQUIRED]: {
    subject: 'authenticationSubject',
    previewText: 'authenticationPreviewText',
    failed: 'authenticationRequired',
    nextStep: 'confirmPayment',
    actionLabel: 'confirmActionLabel',
  },
} as const;

export const sendPaymentFailedNotice = async (
  invoice: Stripe.Invoice,
  tenantId: string,
  plan: TTenantPlan,
  failure: TValueOf<typeof PAYMENT_FAILURE>,
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
  const copy = FAILURE_COPY[failure];

  await sendEmail({
    account: EMAIL_ACCOUNT.PLATFORM,
    to: ownerEmail,
    from,
    ...buildOwnerPaymentFailedEmail({
      brandName: PLATFORM_EMAIL_BRAND_NAME,
      subject: t(copy.subject, values),
      previewText: t(copy.previewText, values),
      paragraphs: [t(copy.failed, values), t(copy.nextStep)],
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
        label: t(copy.actionLabel),
        url:
          hosted_invoice_url ??
          new URL(adminRoutes.dashboardBilling(), baseUrl).toString(),
      },
    }),
  });
};
