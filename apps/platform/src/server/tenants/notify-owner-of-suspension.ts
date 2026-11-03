import 'server-only';

import { queries, TENANT_STATUS, type TSuspensionStatus } from '@blog/db';
import type { TTenantSuspension } from '@blog/db/schema/tenant-suspensions';
import type { TTenant } from '@blog/db/schema/tenants';
import {
  buildOwnerSuspensionEmail,
  buildOwnerSuspensionLiftedEmail,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
} from '@blog/email';
import { TENANT_LOG } from '@platform/constants/tenant';
import { env } from '@platform/utils/env/env';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { getTranslations } from 'next-intl/server';

const sendSuspensionEmail = async (
  tenant: TTenant,
  { reference, category, description }: TTenantSuspension,
  status: TSuspensionStatus,
): Promise<void> => {
  const {
    OWNER_EMAIL_FROM_ADDRESS: from,
    PLATFORM_APP_BASE_URL: baseUrl,
    SUPPORT_REPLY_TO_ADDRESS: replyTo,
  } = env;
  const { id: tenantId, name: siteName, locale } = tenant;
  if (!from || !baseUrl) {
    logger.warn(TENANT_LOG.SUSPENSION_EMAIL_UNCONFIGURED, { tenantId });
    return;
  }

  const ownerEmail = await queries.memberships.getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    logger.warn(TENANT_LOG.SUSPENSION_EMAIL_OWNER_MISSING, { tenantId });
    return;
  }
  if (!replyTo) {
    logger.warn(TENANT_LOG.SUSPENSION_EMAIL_REPLY_TO_MISSING, { tenantId });
  }

  const t = await getTranslations({
    locale,
    namespace: 'ownerSuspensionEmail',
  });
  const tCategory = await getTranslations({
    locale,
    namespace: 'suspensionCategory',
  });
  const values = { siteName, reference };
  const action = {
    label: t('actionLabel'),
    url: new URL(
      adminRoutes.dashboardSelectTenantHref(tenantId),
      baseUrl,
    ).toString(),
  };

  const message =
    status === TENANT_STATUS.SUSPENDED
      ? buildOwnerSuspensionEmail({
          brandName: PLATFORM_EMAIL_BRAND_NAME,
          subject: t('SUSPENDED.subject', values),
          previewText: t('SUSPENDED.previewText', values),
          paragraphs: [
            t('SUSPENDED.offline', values),
            t('SUSPENDED.category', { category: tCategory(category) }),
            description,
            ...(replyTo ? [t('SUSPENDED.contest', values)] : []),
          ],
          action,
        })
      : buildOwnerSuspensionLiftedEmail({
          brandName: PLATFORM_EMAIL_BRAND_NAME,
          subject: t('ACTIVE.subject', values),
          previewText: t('ACTIVE.previewText', values),
          paragraphs: [t('ACTIVE.online', values)],
          action,
        });

  await sendEmail({ to: ownerEmail, from, replyTo, ...message });
};

export const notifyOwnerOfSuspension = async (
  tenant: TTenant,
  suspension: TTenantSuspension,
  status: TSuspensionStatus,
): Promise<void> => {
  try {
    await sendSuspensionEmail(tenant, suspension, status);
  } catch (error) {
    logger.error(TENANT_LOG.SUSPENSION_EMAIL_FAILED, {
      tenantId: tenant.id,
      reference: suspension.reference,
      status,
      ...toLoggableError(error),
    });
  }
};
