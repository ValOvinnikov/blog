'use client';

import { PlanChoices } from '@platform/components/features/upgrade/plan-choices';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { LinkButton } from '@platform/components/shared/link-button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TPlanChoice } from '@platform/constants/plan-change';
import type { TPendingPlanChange } from '@platform/server/billing/load-subscription-plan';
import { isSamePlanChoice } from '@platform/utils/plan-change-timing/plan-change-timing';
import { richDate } from '@platform/utils/rich-date/rich-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { ALERT_TYPE, type TMaybeUndefined } from '@shinefold/config';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';

import { PlanChangeStatus } from './components/plan-change-status/plan-change-status';
import { PlanChangeSummary } from './components/plan-change-summary/plan-change-summary';
import { planChangeVariants } from './plan-change-variants';
import { usePlanChange } from './use-plan-change';

export type TPlanChangeProps = {
  tenantId: string;
  current: TPlanChoice;
  renewsAt: Date;
  pending: TMaybeUndefined<TPendingPlanChange>;
  publishableKey?: string;
};

export const PlanChange = ({
  tenantId,
  current,
  renewsAt,
  pending,
  publishableKey,
}: TPlanChangeProps) => {
  const t = useTranslations('upgradePage');
  const tPlan = useTranslations('planNames');
  const locale = useLocale();
  const [choice, setChoice] = useState(current);
  const { submit, isPending, ...progress } = usePlanChange(
    tenantId,
    current.plan,
    publishableKey,
  );
  const { body } = planChangeVariants();
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
      <Card.Body className={body()}>
        {pending && (
          <Alert
            type={ALERT_TYPE.INFO}
            role="note"
            description={t.rich('pendingChange', {
              ...choiceText(pending),
              ...richDate(pending.startsAt, locale),
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
          isDisabled={(isCurrent && !pending) || progress.isConfirming}
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
