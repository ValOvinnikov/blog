'use client';

import {
  ALERT_TYPE,
  isOutcomeRefused,
  isOutcomeSuccess,
  SIZE,
  type TMaybeUndefined,
} from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import {
  BILLING_INTERVAL,
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

import {
  CheckoutChoices,
  type TCheckoutChoice,
} from './components/checkout-choices/checkout-choices';

export type TUpgradeCheckoutProps = {
  tenantId: string;
  publishableKey: string;
  promo?: string;
  initialPlan?: TTenantPlan;
};

export const UpgradeCheckout = ({
  tenantId,
  publishableKey,
  promo,
  initialPlan = TENANT_PLAN.GROWTH,
}: TUpgradeCheckoutProps) => {
  const t = useTranslations('upgradePage');
  const [stripePromise] = useState(() => loadStripe(publishableKey));
  const [choice, setChoice] = useState<TCheckoutChoice>({
    plan: initialPlan,
    interval: BILLING_INTERVAL.MONTHLY,
  });
  const [attempt, setAttempt] = useState(0);
  const [refusal, setRefusal] = useState<TMaybeUndefined<TUpgradeRefusal>>();
  const [hasFailed, setHasFailed] = useState(false);

  const fetchClientSecret = async (): Promise<string> => {
    const result = await createUpgradeCheckoutAction(tenantId, {
      ...choice,
      promo,
    });
    if (isOutcomeSuccess(result)) return result.clientSecret;
    if (isOutcomeRefused(result)) setRefusal(result.reason);
    else setHasFailed(true);
    throw new Error(result.outcome);
  };

  const changeChoice = (nextChoice: TCheckoutChoice) => {
    setHasFailed(false);
    setChoice(nextChoice);
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
        key={`${choice.plan}-${choice.interval}-${attempt}`}
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
        actions={<CheckoutChoices choice={choice} onChange={changeChoice} />}
      />
      <Card.Body>{body()}</Card.Body>
    </Card>
  );
};
