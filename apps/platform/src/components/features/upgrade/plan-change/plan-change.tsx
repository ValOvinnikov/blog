'use client';

import { ALERT_TYPE, type TMaybeUndefined } from '@blog/config';
import { PlanChoices } from '@platform/components/features/upgrade/plan-choices';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { LinkButton } from '@platform/components/shared/link-button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TPlanChoice } from '@platform/constants/plan-change';
import type { TPendingPlanChange } from '@platform/server/billing/load-subscription-plan';
import { formatDate } from '@platform/utils/format-date/format-date';
import { isSamePlanChoice } from '@platform/utils/plan-change-timing/plan-change-timing';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useLocale, useTranslations } from 'next-intl';
import { type ReactNode, useState } from 'react';

import { PlanChangeStatus } from './components/plan-change-status/plan-change-status';
import { PlanChangeSummary } from './components/plan-change-summary/plan-change-summary';
import { usePlanChange } from './use-plan-change';

export type TPlanChangeProps = {
  tenantId: string;
  current: TPlanChoice;
  renewsAt: Date;
  pending: TMaybeUndefined<TPendingPlanChange>;
};

export const PlanChange = ({
  tenantId,
  current,
  renewsAt,
  pending,
}: TPlanChangeProps) => {
  const t = useTranslations('upgradePage');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();
  const [choice, setChoice] = useState(current);
  const { submit, isPending, ...progress } = usePlanChange(
    tenantId,
    current.plan,
  );
  const isCurrent = isSamePlanChoice(choice, current);
  const choiceText = ({ plan, interval }: TPlanChoice) => ({
    plan: tPlan(plan),
    interval,
  });

  return (
    <Card>
      <Card.Header
        title={t('changePlanTitle')}
        supportingText={t('currentPlan', choiceText(current))}
        actions={<PlanChoices choice={choice} onChange={setChoice} />}
      />
      <Card.Body>
        {pending && (
          <Alert
            type={ALERT_TYPE.INFO}
            role="note"
            description={t.rich('pendingChange', {
              ...choiceText(pending),
              date: formatDate(pending.startsAt, locale),
              time: (chunks: ReactNode) => (
                <time dateTime={pending.startsAt.toISOString()}>{chunks}</time>
              ),
            })}
          />
        )}
        <PlanChangeStatus
          progress={progress}
          fallback={
            <PlanChangeSummary
              current={current}
              choice={choice}
              renewsAt={renewsAt}
              pending={pending}
            />
          }
        />
      </Card.Body>
      <Card.Footer>
        <LinkButton href={adminRoutes.dashboardBilling()}>
          {t('billingLink')}
        </LinkButton>
        <Button
          variant={BUTTON_VARIANT.PRIMARY}
          isDisabled={isCurrent && !pending}
          isPending={isPending}
          pendingLabel={t('changePending')}
          onClick={() => submit(choice)}
        >
          {isCurrent && pending
            ? t('keepCurrent', { plan: tPlan(current.plan) })
            : t('changeSubmit')}
        </Button>
      </Card.Footer>
    </Card>
  );
};
