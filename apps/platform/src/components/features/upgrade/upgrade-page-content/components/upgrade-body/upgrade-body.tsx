import { ALERT_TYPE, SIZE } from '@blog/config';
import type { TMembership } from '@blog/db/schema/memberships';
import { UpgradeCheckout } from '@platform/components/features/upgrade/upgrade-checkout';
import { UpgradeConfirming } from '@platform/components/features/upgrade/upgrade-confirming';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { BILLING_LOG, UPGRADE_STATE } from '@platform/constants/billing';
import { upgradeStateFor } from '@platform/server/billing/upgrade-state-for';
import { logger } from '@platform/utils/logger/logger';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { adminRoutes } from '@platform/utils/routes/routes';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';
import { useTranslations } from 'next-intl';

export type TUpgradeBodyProps = {
  tenant: TPlatformTenant;
  membership: TMembership;
  promo?: string;
  isReturning: boolean;
};

export const UpgradeBody = ({
  tenant,
  membership,
  promo,
  isReturning,
}: TUpgradeBodyProps) => {
  const t = useTranslations('upgradePage');
  const tPlan = useTranslations('planNames');
  const state = upgradeStateFor(tenant, membership);
  const { id: tenantId, plan, trial } = tenant;

  if (state === UPGRADE_STATE.SUBSCRIBED) {
    return (
      <Alert
        type={ALERT_TYPE.SUCCESS}
        title={t('subscribedTitle', { plan: tPlan(plan) })}
        description={t('subscribedDescription')}
        action={
          <LinkButton href={adminRoutes.dashboard()} size={SIZE.SM}>
            {t('backToOverview')}
          </LinkButton>
        }
      />
    );
  }
  if (isReturning) {
    return <UpgradeConfirming tenantId={tenantId} initialState={state} />;
  }
  if (state !== UPGRADE_STATE.AVAILABLE) {
    return <Alert type={ALERT_TYPE.INFO} role="note" description={t(state)} />;
  }

  const publishableKey = stripeEnv.STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey) {
    logger.error(BILLING_LOG.CHECKOUT_UNCONFIGURED, {
      tenantId,
      hasPublishableKey: false,
    });
    return <Alert type={ALERT_TYPE.ERROR} description={t('unconfigured')} />;
  }

  return (
    <UpgradeCheckout
      tenantId={tenantId}
      publishableKey={publishableKey}
      promo={promo}
      initialPlan={trial?.plan}
    />
  );
};
