import { ALERT_TYPE, SIZE } from '@blog/config';
import type { TMembership } from '@blog/db/schema/memberships';
import type { TTenant } from '@blog/db/schema/tenants';
import { UpgradeCheckout } from '@platform/components/features/upgrade/upgrade-checkout';
import { UpgradeConfirming } from '@platform/components/features/upgrade/upgrade-confirming';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { PageHeader } from '@platform/components/shared/page-header';
import { PageStack } from '@platform/components/shared/page-stack';
import { BILLING_LOG, UPGRADE_STATE } from '@platform/constants/billing';
import { upgradeStateFor } from '@platform/server/billing/upgrade-state-for';
import { logger } from '@platform/utils/logger/logger';
import { adminRoutes } from '@platform/utils/routes/routes';
import { stripeEnv } from '@platform/utils/stripe-env/stripe-env';
import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

export type TUpgradePageContentProps = {
  tenant: TTenant;
  membership: TMembership;
  promo?: string;
  isReturning: boolean;
};

const UpgradeBody = async ({
  tenant,
  membership,
  promo,
  isReturning,
}: TUpgradePageContentProps): Promise<ReactNode> => {
  const t = await getTranslations('upgradePage');
  const state = upgradeStateFor(tenant, membership);
  const { id: tenantId } = tenant;

  if (state === UPGRADE_STATE.ON_GROWTH) {
    return (
      <Alert
        type={ALERT_TYPE.SUCCESS}
        title={t('onGrowthTitle')}
        description={t('onGrowthDescription')}
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
    />
  );
};

export const UpgradePageContent = async (props: TUpgradePageContentProps) => {
  const t = await getTranslations('upgradePage');

  return (
    <PageStack>
      <PageHeader title={t('pageTitle')} description={t('description')} />
      {await UpgradeBody(props)}
    </PageStack>
  );
};
