import 'server-only';

import { ENTITLEMENT_GRANT_LOG } from '@platform/constants/entitlement-grant';
import { env } from '@platform/utils/env/env';
import { formatDate } from '@platform/utils/format-date/format-date';
import { toGrantItemLabel } from '@platform/utils/grant-item-label/grant-item-label';
import { toLoggableError } from '@platform/utils/loggable-error/loggable-error';
import { logger } from '@platform/utils/logger/logger';
import type { TLooseTranslator } from '@platform/utils/loose-translator/loose-translator';
import { adminRoutes } from '@platform/utils/routes/routes';
import { EMAIL_ACCOUNT } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import type { TTenantEntitlementGrant } from '@shinefold/db/schema/tenant-entitlement-grants';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { isEntitlementGrantActive } from '@shinefold/db/utils/resolve-tenant-entitlements/resolve-tenant-entitlements';
import {
  buildOwnerEntitlementEmail,
  PLATFORM_EMAIL_BRAND_NAME,
  sendEmail,
  type TOwnerEntitlementEmailInput,
} from '@shinefold/email';
import { isNull } from '@shinefold/utils/primitives';
import { getTranslations } from 'next-intl/server';

type TEntitlementCopy = Pick<
  TOwnerEntitlementEmailInput,
  'subject' | 'previewText' | 'paragraphs'
>;

type TComposeEntitlementCopy = (
  t: TLooseTranslator,
  values: { siteName: string; item: string },
) => TEntitlementCopy;

const sendEntitlementEmail = async (
  { id: tenantId, name: siteName, locale }: TTenant,
  grant: TTenantEntitlementGrant,
  compose: TComposeEntitlementCopy,
): Promise<void> => {
  const { OWNER_EMAIL_FROM_ADDRESS: from, PLATFORM_APP_BASE_URL: baseUrl } =
    env;
  if (!from || !baseUrl) {
    logger.warn(ENTITLEMENT_GRANT_LOG.EMAIL_UNCONFIGURED, { tenantId });
    return;
  }

  const ownerEmail = await queries.memberships.getTenantOwnerEmail(tenantId);
  if (!ownerEmail) {
    logger.warn(ENTITLEMENT_GRANT_LOG.EMAIL_OWNER_MISSING, { tenantId });
    return;
  }

  const [t, tFeature, tNames] = await Promise.all([
    getTranslations({ locale, namespace: 'ownerEntitlementEmail' }),
    getTranslations({ locale, namespace: 'featuresSettings' }),
    getTranslations({ locale, namespace: 'grantItemNames' }),
  ]);
  const item = toGrantItemLabel({ tFeature, tNames }, grant);

  await sendEmail({
    account: EMAIL_ACCOUNT.PLATFORM,
    to: ownerEmail,
    from,
    ...buildOwnerEntitlementEmail({
      brandName: PLATFORM_EMAIL_BRAND_NAME,
      ...compose(t, { siteName, item }),
      action: {
        label: t('actionLabel'),
        url: new URL(
          adminRoutes.dashboardSelectTenantHref(tenantId),
          baseUrl,
        ).toString(),
      },
    }),
  });
};

const notifyOwner = async (
  tenant: TTenant,
  grant: TTenantEntitlementGrant,
  compose: TComposeEntitlementCopy,
): Promise<void> => {
  try {
    await sendEntitlementEmail(tenant, grant, compose);
  } catch (error) {
    logger.error(ENTITLEMENT_GRANT_LOG.EMAIL_FAILED, {
      tenantId: tenant.id,
      grantId: grant.id,
      ...toLoggableError(error),
    });
  }
};

export const notifyOwnerOfEntitlementGrant = (
  tenant: TTenant,
  grant: TTenantEntitlementGrant,
): Promise<void> => {
  const { expiresAt } = grant;

  return notifyOwner(tenant, grant, (t, values) => ({
    subject: t('granted.subject', values),
    previewText: t('granted.previewText', values),
    paragraphs: [
      t('granted.granted', values),
      isNull(expiresAt)
        ? t('granted.untilRevoked')
        : t('granted.expires', { date: formatDate(expiresAt, tenant.locale) }),
      t('granted.free'),
    ],
  }));
};

/** Sends nothing for a grant that had already ended by its date, since revoking it takes nothing away. */
export const notifyOwnerOfEntitlementRevoke = async (
  tenant: TTenant,
  grant: TTenantEntitlementGrant,
): Promise<void> => {
  if (!isEntitlementGrantActive({ ...grant, revokedAt: null }, new Date())) {
    return;
  }

  await notifyOwner(tenant, grant, (t, values) => ({
    subject: t('revoked.subject', values),
    previewText: t('revoked.previewText'),
    paragraphs: [t('revoked.revoked', values), t('revoked.kept')],
  }));
};
