'use client';

import {
  ALERT_TYPE,
  isOutcomeRefused,
  isOutcomeSuccess,
  SIZE,
  type TMaybeUndefined,
} from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import {
  BILLING_INTERVAL,
  type TBillingInterval,
  type TUpgradeRefusal,
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
  const [attempt, setAttempt] = useState(0);
  const [refusal, setRefusal] = useState<TMaybeUndefined<TUpgradeRefusal>>();
  const [hasFailed, setHasFailed] = useState(false);

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createUpgradeCheckoutAction(tenantId, {
      interval,
      promo,
    });
    if (isOutcomeSuccess(result)) return result.clientSecret;
    if (isOutcomeRefused(result)) setRefusal(result.reason);
    else setHasFailed(true);
    throw new Error(result.outcome);
  };

  const changeInterval = (nextInterval: TBillingInterval) => {
    setHasFailed(false);
    setBillingInterval(nextInterval);
  };

  const tryAgain = () => {
    setHasFailed(false);
    setAttempt((count) => count + 1);
  };

  const body = () => {
    if (refusal) {
      return (
        <Alert type={ALERT_TYPE.INFO} role="note" description={t(refusal)} />
      );
    }
    if (hasFailed) {
      return (
        <Alert
          type={ALERT_TYPE.ERROR}
          description={t('checkoutFailed')}
          action={
            <Button size={SIZE.SM} onClick={tryAgain}>
              {t('tryAgain')}
            </Button>
          }
        />
      );
    }
    return (
      <EmbeddedCheckoutProvider
        key={`${interval}-${attempt}`}
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    );
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
      <Card.Body>{body()}</Card.Body>
    </Card>
  );
};
