import { ALERT_TYPE } from '@blog/config';
import { SELLABLE_TENANT_PLANS } from '@blog/config/constants';
import { isOneOf } from '@blog/utils/primitives';
import { UpgradeCheckout } from '@platform/components/features/upgrade/upgrade-checkout';
import { UpgradeConfirming } from '@platform/components/features/upgrade/upgrade-confirming';
import { PlanChangeSection } from '@platform/components/features/upgrade/upgrade-page-content/components/plan-change-section/plan-change-section';
import { SubscribedNotice } from '@platform/components/features/upgrade/upgrade-page-content/components/subscribed-notice/subscribed-notice';
import { Alert } from '@platform/components/shared/alert';
import { BILLING_LOG, UPGRADE_STATE } from '@platform/constants/billing';
import type { TPlatformViewer } from '@platform/server/auth/platform-viewer';
import {
  planChangeRefusalFor,
  upgradeStateFor,
} from '@platform/server/billing/upgrade-state-for';
import { logger } from '@platform/utils/logger/logger';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';
import { useTranslations } from 'next-intl';

export type TUpgradeBodyProps = {
  tenant: TPlatformTenant;
  viewer: TPlatformViewer;
  promo?: string;
  isReturning: boolean;
};

export const UpgradeBody = ({
  tenant,
  viewer,
  promo,
  isReturning,
}: TUpgradeBodyProps) => {
  const t = useTranslations('upgradePage');
  const state = upgradeStateFor(tenant, viewer);
  const { id: tenantId, plan, trial, stripeSubscriptionId } = tenant;

  if (state === UPGRADE_STATE.SUBSCRIBED) {
    return stripeSubscriptionId && !planChangeRefusalFor(tenant, viewer) ? (
      <PlanChangeSection
        tenantId={tenantId}
        subscriptionId={stripeSubscriptionId}
      />
    ) : (
      <SubscribedNotice plan={plan} />
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
      initialPlan={
        trial && isOneOf(SELLABLE_TENANT_PLANS, trial.plan)
          ? trial.plan
          : undefined
      }
    />
  );
};
