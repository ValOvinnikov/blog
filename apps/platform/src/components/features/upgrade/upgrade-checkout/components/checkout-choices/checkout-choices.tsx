import type { TTenantPlan } from '@blog/db/constants';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import {
  BILLING_INTERVAL,
  type TBillingInterval,
} from '@platform/constants/billing';
import { SELLABLE_PLANS } from '@platform/utils/sellable-plans/sellable-plans';
import { useTranslations } from 'next-intl';

import { checkoutChoicesVariants } from './checkout-choices-variants';

export type TCheckoutChoice = {
  plan: TTenantPlan;
  interval: TBillingInterval;
};

export type TCheckoutChoicesProps = {
  choice: TCheckoutChoice;
  onChange: (choice: TCheckoutChoice) => void;
};

export const CheckoutChoices = ({
  choice,
  onChange,
}: TCheckoutChoicesProps) => {
  const t = useTranslations('upgradePage');
  const tPlan = useTranslations('planNames');
  const { plan, interval } = choice;
  const { choices } = checkoutChoicesVariants();

  return (
    <div className={choices()}>
      <SegmentedControl
        options={SELLABLE_PLANS.map((value) => ({
          value,
          label: tPlan(value),
        }))}
        value={plan}
        onChange={(nextPlan) => onChange({ plan: nextPlan, interval })}
        aria={{ label: t('planLabel') }}
      />
      <SegmentedControl
        options={Object.values(BILLING_INTERVAL).map((value) => ({
          value,
          label: t(value),
        }))}
        value={interval}
        onChange={(nextInterval) => onChange({ plan, interval: nextInterval })}
        aria={{ label: t('intervalLabel') }}
      />
    </div>
  );
};
