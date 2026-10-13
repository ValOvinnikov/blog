import { TENANT_PROVISIONING_STEP_STATUS } from '@blog/db/constants';
import { Disclosure } from '@platform/components/shared/disclosure';
import type { THeadingLevel } from '@platform/components/shared/heading';
import { headingVariants } from '@platform/components/shared/heading/heading-variants';
import { StatusBadge } from '@platform/components/shared/status-badge';
import {
  StepList,
  type TStepListStep,
} from '@platform/components/shared/step-list';
import { formatRelativeTime } from '@platform/utils/format-relative-time/format-relative-time';
import { useCollapseOnDone } from '@platform/utils/use-collapse-on-done/use-collapse-on-done';
import { useLocale, useTranslations } from 'next-intl';

import { runStepsCardVariants } from './run-steps-card-variants';

type TRunStepsCardStep = Pick<
  TStepListStep,
  'key' | 'title' | 'status' | 'updatedAt'
>;

type TRunStepsCardProps = {
  title: string;
  steps: TRunStepsCardStep[];
  isDone: boolean;
  isPreRun?: boolean;
  headingLevel?: Exclude<THeadingLevel, 1>;
};

export const RunStepsCard = ({
  title,
  steps,
  isDone,
  isPreRun = false,
  headingLevel = 2,
}: TRunStepsCardProps) => {
  const t = useTranslations('runStatus');
  const locale = useLocale();
  const { isOpen, onOpenChange } = useCollapseOnDone(isDone);
  const { card, summary } = runStepsCardVariants();

  const doneStepCount = steps.filter(
    ({ status }) => status === TENANT_PROVISIONING_STEP_STATUS.DONE,
  ).length;

  const stepListSteps = steps.map((step) => {
    const { status, updatedAt } = step;
    const isSettled =
      status === TENANT_PROVISIONING_STEP_STATUS.DONE ||
      status === TENANT_PROVISIONING_STEP_STATUS.FAILED;

    return {
      ...step,
      statusLabel: isPreRun
        ? t('preRunStepStatusLabel')
        : t(`statusLabel.${status}`),
      trailingSlot:
        status === TENANT_PROVISIONING_STEP_STATUS.RUNNING
          ? t('stepRunningNow')
          : undefined,
      updatedAtLabel:
        isSettled && updatedAt
          ? formatRelativeTime(new Date(updatedAt), t, locale)
          : undefined,
    };
  });

  return (
    <Disclosure
      className={card()}
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      headingLevel={headingLevel}
      summary={
        <span className={summary()}>
          <span className={headingVariants({ size: 'cardTitle' })}>
            {title}
          </span>
          <StatusBadge tone="neutral">
            {t('stepsCompletionBadge', {
              done: doneStepCount,
              total: steps.length,
            })}
          </StatusBadge>
        </span>
      }
    >
      <StepList steps={stepListSteps} />
    </Disclosure>
  );
};
