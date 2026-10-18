import { ACTION_OUTCOME, ALERT_TYPE, type TAlertType } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { TENANT_REFUSAL } from '@platform/constants/tenant';
import type { TDispatchNoticeKind } from '@platform/utils/use-provisioning-poll/use-provisioning-poll';
import { useTranslations } from 'next-intl';

const NOTICE_MESSAGES = {
  [TENANT_REFUSAL.NOT_FOUND]: {
    type: ALERT_TYPE.ERROR,
    titleKey: 'startErrorNotFound',
  },
  [TENANT_REFUSAL.ARCHIVED]: {
    type: ALERT_TYPE.ERROR,
    titleKey: 'startErrorArchived',
  },
  [TENANT_REFUSAL.ALREADY_IN_PROGRESS]: {
    type: ALERT_TYPE.INFO,
    titleKey: 'startNoticeAlreadyInProgress',
  },
  [ACTION_OUTCOME.SERVER_ERROR]: {
    type: ALERT_TYPE.ERROR,
    titleKey: 'startError',
  },
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
