'use client';

import {
  ALERT_TYPE,
  isOutcomeRefused,
  isOutcomeSuccess,
  type TMaybeUndefined,
} from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import {
  BILLING_INTERVAL,
  type TBillingInterval,
} from '@platform/constants/billing';
import { createUpgradeCheckoutAction } from '@platform/server/billing/create-upgrade-checkout-action';
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export type TUpgradeCheckoutProps = {
  tenantId: string;
  publishableKey: string;
  promo?: string;
};

export const UpgradeCheckout = ({
  tenantId,
  publishableKey,
  promo,
}: TUpgradeCheckoutProps) => {
  const t = useTranslations('upgradePage');
  const [stripePromise] = useState(() => loadStripe(publishableKey));
  const [interval, setBillingInterval] = useState<TBillingInterval>(
    BILLING_INTERVAL.MONTHLY,
  );
  const [error, setError] = useState<TMaybeUndefined<string>>();

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createUpgradeCheckoutAction(tenantId, {
      interval,
      promo,
    });
    if (isOutcomeSuccess(result)) return result.clientSecret;
    setError(isOutcomeRefused(result) ? t(result.reason) : t('checkoutFailed'));
    throw new Error(result.outcome);
  };

  const changeInterval = (nextInterval: TBillingInterval) => {
    setError(undefined);
    setBillingInterval(nextInterval);
  };

  return (
    <Card>
      <Card.Header
        title={t('checkoutTitle')}
        supportingText={t('checkoutDescription')}
        actions={
          <SegmentedControl
            options={Object.values(BILLING_INTERVAL).map((value) => ({
              value,
              label: t(value),
            }))}
            value={interval}
            onChange={changeInterval}
            aria={{ label: t('intervalLabel') }}
          />
        }
      />
      <Card.Body>
        {error ? (
          <Alert type={ALERT_TYPE.ERROR} description={error} />
        ) : (
          <EmbeddedCheckoutProvider
            key={interval}
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        )}
      </Card.Body>
    </Card>
  );
};
