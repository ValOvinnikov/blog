import 'server-only';

import { TENANT_LOG } from '@platform/constants/tenant';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { toMarketingSiteUrl } from '@platform/utils/marketing-site-url/marketing-site-url';
import { adminRoutes } from '@platform/utils/routes/routes';
import { routes } from '@shinefold/config';
import { EMAIL_ACCOUNT, type TTenantPlan } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
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
    OWNER_EMAIL_FROM_ADDRESS: from,
    PLATFORM_APP_BASE_URL: baseUrl,
    MARKETING_SITE_URL: marketingSiteUrl,
    TENANT_ROOT_DOMAIN: rootDomain,
  } = env;
  if (!from || !baseUrl) {
    logger.warn(TENANT_LOG.PLAN_CHANGE_EMAIL_UNCONFIGURED, { tenantId });
    return;
  }

  const [tenant, ownerEmail] = await Promise.all([
    queries.tenants.getTenantById(tenantId),
    queries.memberships.getTenantOwnerEmail(tenantId),
  ]);
  if (!tenant || !ownerEmail) {
    logger.warn(TENANT_LOG.PLAN_CHANGE_EMAIL_OWNER_MISSING, { tenantId });
    return;
  }

  const t = await getTranslations({
    locale: tenant.locale,
    namespace: 'ownerPlanChangeEmail',
  });
  const values = { siteName: tenant.name };
  const siteUrl = toMarketingSiteUrl({ marketingSiteUrl, rootDomain });
  const message = buildOwnerPlanChangeEmail({
    brandName: PLATFORM_EMAIL_BRAND_NAME,
    subject: t(`${toPlan}.subject`),
    previewText: t(`${toPlan}.previewText`, values),
    paragraphs: [t(`${toPlan}.changed`, values), t(`${toPlan}.kept`)],
    action: {
      label: t('actionLabel'),
      url: new URL(
        adminRoutes.dashboardSelectTenantHref(tenantId),
        baseUrl,
      ).toString(),
    },
    secondaryLink: siteUrl
      ? {
          label: t('plansLinkLabel'),
          url: new URL(routes.pricingComparison(), siteUrl).href,
        }
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
