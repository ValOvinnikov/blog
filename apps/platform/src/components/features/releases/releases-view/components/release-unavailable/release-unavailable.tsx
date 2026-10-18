import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import type { TReleaseCandidateFailureReason } from '@platform/server/releases/release-result';
import { useTranslations } from 'next-intl';

import { RetryButton } from './components/retry-button/retry-button';

export type TReleaseUnavailableProps = {
  reason: TReleaseCandidateFailureReason;
};

export const ReleaseUnavailable = ({ reason }: TReleaseUnavailableProps) => {
  const t = useTranslations('releaseUnavailable');

  return (
    <Alert
      type={ALERT_TYPE.ERROR}
      title={t('title')}
      description={t(`reason.${reason}`)}
      action={<RetryButton />}
    />
  );
};
