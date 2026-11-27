import {
  ICONS,
  PLAN_COMPARISON_ANCHOR_ID,
  TEXT_ROLE,
} from '@shinefold/config/constants';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { Table } from '@shinefold/ui/components/molecules/table';
import {
  PLAN_COMPARISON_PLANS,
  toPlanComparisonRows,
  type TPlanComparisonValue,
} from '@web/utils/to-plan-comparison-rows';
import { useFormatter, useTranslations } from 'next-intl';

import { planComparisonTableVariants } from './plan-comparison-table-variants';

const s = planComparisonTableVariants();

export const PlanComparisonTable = () => {
  const t = useTranslations('pricingModule.compare');
  const format = useFormatter();
  const heading = t('heading');

  const renderValue = (value: TPlanComparisonValue) => {
    if (typeof value === 'boolean') {
      return (
        <>
          <Icon
            name={value ? ICONS.CHECK : ICONS.CLOSE}
            className={value ? undefined : s.notIncluded()}
          />
          <span className={s.label()}>
            {value ? t('included') : t('notIncluded')}
          </span>
        </>
      );
    }
    if (typeof value === 'number') return format.number(value);
    const { count, total } = value;
    return count === total ? t('all') : t('share', { count, total });
  };

  return (
    <div className={s.root()}>
      <Heading
        level={3}
        visual={TEXT_ROLE.ITEM_TITLE}
        id={PLAN_COMPARISON_ANCHOR_ID}
        className={s.heading()}
      >
        {heading}
      </Heading>
      <Table ariaLabel={heading}>
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell>{t('feature')}</Table.HeaderCell>
            {PLAN_COMPARISON_PLANS.map((plan) => (
              <Table.HeaderCell key={plan}>
                {t(`plans.${plan}`)}
              </Table.HeaderCell>
            ))}
          </Table.Row>
        </Table.Head>
        {toPlanComparisonRows().map(({ row, values }) => (
          <Table.Row key={row}>
            <Table.HeaderCell isRowHeader={true}>
              {t(`rows.${row}`)}
            </Table.HeaderCell>
            {PLAN_COMPARISON_PLANS.map((plan) => (
              <Table.Cell key={plan}>{renderValue(values[plan])}</Table.Cell>
            ))}
          </Table.Row>
        ))}
      </Table>
    </div>
  );
};
