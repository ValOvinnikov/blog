import { ALERT_TYPE, type TAlertType } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import type { TDispatchNoticeKind } from '@platform/utils/use-provisioning-poll/use-provisioning-poll';
import { useTranslations } from 'next-intl';

const NOTICE_MESSAGES = {
  'not-found': { type: ALERT_TYPE.ERROR, titleKey: 'startErrorNotFound' },
  archived: { type: ALERT_TYPE.ERROR, titleKey: 'startErrorArchived' },
  'already-in-progress': {
    type: ALERT_TYPE.INFO,
    titleKey: 'startNoticeAlreadyInProgress',
  },
  other: { type: ALERT_TYPE.ERROR, titleKey: 'startError' },
} as const satisfies Record<
  TDispatchNoticeKind,
  { type: TAlertType; titleKey: string }
>;

type TDispatchNoticeProps = {
  notice: TDispatchNoticeKind;
};

export const DispatchNotice = ({ notice }: TDispatchNoticeProps) => {
  const t = useTranslations('provisioningStatusView');
  const { type, titleKey } = NOTICE_MESSAGES[notice];

  return <Alert type={type} title={t(titleKey)} />;
};
