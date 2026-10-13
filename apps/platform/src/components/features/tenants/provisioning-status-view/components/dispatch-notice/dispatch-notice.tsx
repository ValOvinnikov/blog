import { ALERT_TYPE, type TAlertType } from '@blog/config';
import type { TDispatchNoticeKind } from '@platform/components/features/tenants/provisioning-status-view/use-provisioning-poll';
import { Alert } from '@platform/components/shared/alert';
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
