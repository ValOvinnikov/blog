import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { GITHUB_FAILURE } from '@platform/constants/github';
import { RELEASE_FAILURE } from '@platform/constants/release';
import type { TReleaseCandidateFailureReason } from '@platform/server/releases/release-result';
import { useTranslations } from 'next-intl';

import { RetryButton } from './components/retry-button/retry-button';

const REASON_KEYS = {
  [GITHUB_FAILURE.NOT_CONFIGURED]: 'notConfigured',
  [GITHUB_FAILURE.RATE_LIMITED]: 'rateLimited',
  [GITHUB_FAILURE.GITHUB_ERROR]: 'githubError',
  [RELEASE_FAILURE.NO_RELEASE_TAG]: 'noReleaseTag',
  [RELEASE_FAILURE.TAG_LIST_INCOMPLETE]: 'tagListIncomplete',
  [RELEASE_FAILURE.DB_ERROR]: 'dbError',
} satisfies Record<TReleaseCandidateFailureReason, string>;

export type TReleaseUnavailableProps = {
  reason: TReleaseCandidateFailureReason;
};

export const ReleaseUnavailable = ({ reason }: TReleaseUnavailableProps) => {
  const t = useTranslations('releaseUnavailable');

  return (
    <Alert
      type={ALERT_TYPE.ERROR}
      title={t('title')}
      description={t(`reason.${REASON_KEYS[reason]}`)}
      action={<RetryButton />}
    />
  );
};
