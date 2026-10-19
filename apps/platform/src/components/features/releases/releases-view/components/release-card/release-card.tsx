'use client';

import { ALERT_TYPE, type TMaybeUndefined } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Card } from '@platform/components/shared/card';
import { Text } from '@platform/components/shared/text';
import {
  IS_PRODUCTION_RELEASE_ENABLED,
  RELEASE_RUN_STATUS,
} from '@platform/constants/release';
import { useToast } from '@platform/context/toast-provider';
import type { TReleaseRun } from '@platform/server/releases/get-release-run';
import type { TReleaseResult } from '@platform/server/releases/release-result';
import type { TReleaseMigrationSummary } from '@platform/server/releases/summarise-release-migrations';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { ReleaseRunStatus } from './components/release-run-status/release-run-status';
import { StartReleaseDialog } from './components/start-release-dialog/start-release-dialog';
import { useReleaseRun } from './use-release-run';

export type TReleaseCardProps = {
  lastTag: string;
  hasChanges: boolean;
  migrations: TReleaseMigrationSummary;
  isOverrideRequired: boolean;
  releaseRun: TReleaseResult<TMaybeUndefined<TReleaseRun>>;
};

export const ReleaseCard = ({
  lastTag,
  hasChanges,
  migrations,
  isOverrideRequired,
  releaseRun,
}: TReleaseCardProps) => {
  const t = useTranslations('releaseCard');
  const toast = useToast();
  const router = useRouter();
  const { run, isUnavailable, isDispatchPending, isActive, markStarted } =
    useReleaseRun(releaseRun);

  const disabledReason = !IS_PRODUCTION_RELEASE_ENABLED
    ? t('pausedHint')
    : isActive
      ? t('runningHint')
      : !hasChanges
        ? t('nothingToReleaseHint', { lastTag })
        : undefined;

  const handleStarted = (startedAt: number) => {
    markStarted(startedAt);
    toast.success({ message: t('started') });
    router.refresh();
  };

  return (
    <Card>
      <Card.Header
        title={t('title')}
        supportingText={t('description')}
        actions={
          <StartReleaseDialog
            lastTag={lastTag}
            migrations={migrations}
            isOverrideRequired={isOverrideRequired}
            disabledReason={disabledReason}
            onStarted={handleStarted}
          />
        }
      />
      <Card.Body>
        {isUnavailable ? (
          <Alert
            type={ALERT_TYPE.WARNING}
            title={t('unavailableTitle')}
            description={t('unavailableDescription')}
          />
        ) : isDispatchPending ? (
          <ReleaseRunStatus status={RELEASE_RUN_STATUS.DISPATCHED} />
        ) : run ? (
          <ReleaseRunStatus status={run.status} run={run} />
        ) : (
          <Text>{t('empty')}</Text>
        )}
      </Card.Body>
    </Card>
  );
};
