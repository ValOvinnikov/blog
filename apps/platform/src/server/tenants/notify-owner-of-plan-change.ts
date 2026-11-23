import 'server-only';

import { TENANT_LOG } from '@platform/constants/tenant';
import { loadOwnerEmailRecipient } from '@platform/server/owner-email/load-owner-email-recipient';
import { dashboardUrl } from '@platform/utils/dashboard-url/dashboard-url';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { toPricingPageUrl } from '@platform/utils/pricing-page-url/pricing-page-url';
import { EMAIL_ACCOUNT, type TTenantPlan } from '@shinefold/config/constants';
import {
  buildOwnerPlanChangeEmail,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
} from '@shinefold/email';
import { getTranslations } from 'next-intl/server';

const sendPlanChangeEmail = async (
  tenantId: string,
  toPlan: TTenantPlan,
): Promise<void> => {
  const {
    PLATFORM_APP_BASE_URL: baseUrl,
    MARKETING_SITE_URL: marketingSiteUrl,
    TENANT_ROOT_DOMAIN: rootDomain,
  } = env;
  if (!baseUrl) {
    logger.warn(TENANT_LOG.PLAN_CHANGE_EMAIL_UNCONFIGURED, { tenantId });
    return;
  }

  const recipient = await loadOwnerEmailRecipient(tenantId, {
    unconfigured: TENANT_LOG.PLAN_CHANGE_EMAIL_UNCONFIGURED,
    ownerMissing: TENANT_LOG.PLAN_CHANGE_EMAIL_OWNER_MISSING,
  });
  if (!recipient) return;

  const {
    from,
    ownerEmail,
    tenant: { locale, name: siteName },
  } = recipient;
  const t = await getTranslations({
    locale,
    namespace: 'ownerPlanChangeEmail',
  });
  const values = { siteName };
  const plansUrl = toPricingPageUrl({ marketingSiteUrl, rootDomain });
  const message = buildOwnerPlanChangeEmail({
    brandName: PLATFORM_EMAIL_BRAND_NAME,
    subject: t(`${toPlan}.subject`),
    previewText: t(`${toPlan}.previewText`, values),
    paragraphs: [t(`${toPlan}.changed`, values), t(`${toPlan}.kept`)],
    action: {
      label: t('actionLabel'),
      url: dashboardUrl(tenantId, baseUrl),
    },
    secondaryLink: plansUrl
      ? { label: t('plansLinkLabel'), url: plansUrl }
      : undefined,
  });

  await sendEmail({
    account: EMAIL_ACCOUNT.PLATFORM,
    to: ownerEmail,
    from,
    ...message,
  });
};

export const notifyOwnerOfPlanChange = async (
  tenantId: string,
  fromPlan: TTenantPlan,
  toPlan: TTenantPlan,
): Promise<void> => {
  if (fromPlan === toPlan) return;

  try {
    await sendPlanChangeEmail(tenantId, toPlan);
  } catch (error) {
    logger.error(TENANT_LOG.PLAN_CHANGE_EMAIL_FAILED, {
      tenantId,
      fromPlan,
      toPlan,
      ...toLoggableError(error),
    });
  }
};
