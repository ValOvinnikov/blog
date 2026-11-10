'use client';

import { PRICE_PERIOD, type TContentAlignment } from '@blog/config';
import { SegmentedControl } from '@blog/ui/components/atoms/segmented-control';
import type { TPricingTabPeriod } from '@web/utils/to-pricing-panels';
import { useTranslations } from 'next-intl';
import { useState, type ReactNode } from 'react';

import { pricingPeriodSwitchVariants } from './pricing-period-switch-variants';

interface IPricingPeriodSwitchPanel {
  period: TPricingTabPeriod;
  content: ReactNode;
}

export interface IPricingPeriodSwitchProps {
  panels: IPricingPeriodSwitchPanel[];
  align?: TContentAlignment;
}

export const PricingPeriodSwitch = ({
  panels,
  align,
}: IPricingPeriodSwitchProps) => {
  const t = useTranslations('pricingModule');
  const [selected, setSelected] = useState<TPricingTabPeriod>(
    PRICE_PERIOD.MONTH,
  );
  const v = pricingPeriodSwitchVariants({ align });

  return (
    <>
      <div className={v.control()}>
        <SegmentedControl
          options={panels.map(({ period }) => ({
            value: period,
            label: t(`tabs.${period}`),
          }))}
          value={selected}
          onChange={setSelected}
          ariaLabel={t('periodSwitchLabel')}
        />
      </div>
      {panels.map(({ period, content }) => (
        <div key={period} hidden={period !== selected}>
          {content}
        </div>
      ))}
    </>
  );
};
