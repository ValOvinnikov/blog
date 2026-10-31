import { ALERT_TYPE, SIZE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { ExternalLinkButton } from '@platform/components/shared/external-link-button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  RELEASE_RUN_STATUS,
  type TReleaseRunStatus,
} from '@platform/constants/release';
import type { TReleaseRun } from '@platform/server/releases/get-release-run';
import { releaseRunStatusTone } from '@platform/utils/status-tone/status-tone';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const releaseRunStatusVariants = tv({
  slots: {
    root: ['flex flex-col items-start gap-2'],
    heading: ['flex flex-wrap items-center gap-2'],
  },
});

export type TReleaseRunStatusProps = {
  status: TReleaseRunStatus;
  run?: Pick<TReleaseRun, 'title' | 'url' | 'isTenantMigrationFailed'>;
};

export const ReleaseRunStatus = ({ status, run }: TReleaseRunStatusProps) => {
  const t = useTranslations('releaseRunStatus');
  const { root, heading } = releaseRunStatusVariants();

  return (
    <div className={root()}>
      <div className={heading()}>
        <StatusBadge tone={releaseRunStatusTone(status)}>
          {t(`status.${status}`)}
        </StatusBadge>
        {run && <Text as="span">{run.title}</Text>}
      </div>
      <Text variant="muted">{t(`explanation.${status}`)}</Text>
      {status === RELEASE_RUN_STATUS.FAILED && run?.isTenantMigrationFailed && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={t('tenantMigrationFailedTitle')}
          description={t('tenantMigrationFailedDescription')}
        />
      )}
      {run && (
        <ExternalLinkButton
          href={run.url}
          variant={BUTTON_VARIANT.SECONDARY}
          size={SIZE.SM}
        >
          {t('viewRun')}
        </ExternalLinkButton>
      )}
    </div>
  );
};
