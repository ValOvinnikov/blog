import { PlanChange } from '@platform/components/features/upgrade/plan-change';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { PLAN_CHANGE_REFUSAL } from '@platform/constants/plan-change';
import { readTenantSubscriptionPlan } from '@platform/server/billing/read-tenant-subscription-plan';
import { richDate } from '@platform/utils/rich-date/rich-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { ALERT_TYPE, SIZE } from '@shinefold/config';
import { getLocale, getTranslations } from 'next-intl/server';

export type TPlanChangeSectionProps = {
  tenantId: string;
  subscriptionId: string;
};

export const PlanChangeSection = async ({
  tenantId,
  subscriptionId,
}: TPlanChangeSectionProps) => {
  const [t, locale, read] = await Promise.all([
    getTranslations('upgradePage'),
    getLocale(),
    readTenantSubscriptionPlan(tenantId, subscriptionId),
  ]);
  if (!read) {
    return <Alert type={ALERT_TYPE.ERROR} description={t('planLoadFailed')} />;
  }

  const {
    current: { plan, interval },
    isChangeable,
    renewsAt,
    endsAt,
    pending,
  } = read.subscription;
  if (!isChangeable) {
    return (
      <Alert
        type={ALERT_TYPE.INFO}
        role="note"
        description={
          endsAt
            ? t.rich('planEnds', richDate(endsAt, locale))
            : t(PLAN_CHANGE_REFUSAL.NOT_ACTIVE)
        }
        action={
          <LinkButton href={adminRoutes.dashboardBilling()} size={SIZE.SM}>
            {t('billingLink')}
          </LinkButton>
        }
      />
    );
  }

  return (
    <PlanChange
      tenantId={tenantId}
      current={{ plan, interval }}
      renewsAt={renewsAt}
      pending={pending}
    />
  );
};
