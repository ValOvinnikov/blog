import { SELLABLE_TENANT_PLANS } from '@blog/config/constants';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { BILLING_INTERVAL } from '@platform/constants/billing';
import { type TPlanChoice } from '@platform/constants/plan-change';
import { useTranslations } from 'next-intl';

import { planChoicesVariants } from './plan-choices-variants';

export type TPlanChoicesProps = {
  choice: TPlanChoice;
  onChange: (choice: TPlanChoice) => void;
};

export const PlanChoices = ({ choice, onChange }: TPlanChoicesProps) => {
  const t = useTranslations('upgradePage');
  const tPlan = useTranslations('planNames');
  const { plan, interval } = choice;
  const { choices } = planChoicesVariants();

  return (
    <div className={choices()}>
      <SegmentedControl
        options={SELLABLE_TENANT_PLANS.map((value) => ({
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
