import {
  MoveUpBand,
  type TMoveUpBandProps,
} from '@platform/components/features/upgrade/move-up-band';
import { AlertLarge } from '@platform/components/shared/alert';
import {
  STATUS_ICON,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import {
  SUBSCRIBERS_NOTICE,
  type TSubscribersNotice,
} from '@platform/constants/subscribers';
import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';
import {
  ALERT_TYPE,
  ICONS,
  type TAlertType,
  type TMaybeUndefined,
} from '@shinefold/config';
import { isUndefined } from '@shinefold/utils/primitives';

import { useSubscribersNoticeCopy } from './use-subscribers-notice-copy';

const NOTICE_TYPE = {
  [SUBSCRIBERS_NOTICE.OPERATOR_PAUSE]: ALERT_TYPE.ERROR,
  [SUBSCRIBERS_NOTICE.BAND_PAUSED]: ALERT_TYPE.ERROR,
  [SUBSCRIBERS_NOTICE.EMAILS_PAUSED]: ALERT_TYPE.ERROR,
  [SUBSCRIBERS_NOTICE.BAND_NEAR]: ALERT_TYPE.WARNING,
  [SUBSCRIBERS_NOTICE.EMAILS_NEAR]: ALERT_TYPE.WARNING,
  [SUBSCRIBERS_NOTICE.MOVED_UP]: ALERT_TYPE.SUCCESS,
} satisfies Record<TSubscribersNotice, TAlertType>;

const NOTICE_ICON = {
  ...STATUS_ICON,
  [ALERT_TYPE.ERROR]: ICONS.PAUSE,
} satisfies Record<TAlertType, TRegisteredIconName>;

export type TSubscribersNoticeProps = {
  data: TSubscribersPageData;
  moveUp: TMaybeUndefined<TMoveUpBandProps>;
};

export const SubscribersNotice = ({
  data,
  moveUp,
}: TSubscribersNoticeProps) => {
  const { notice } = data;
  const copy = useSubscribersNoticeCopy(data);

  if (isUndefined(notice) || isUndefined(copy)) return null;

  const type = NOTICE_TYPE[notice];
  const { title, description, note, hasMoveUp } = copy;

  return (
    <AlertLarge
      type={type}
      icon={NOTICE_ICON[type]}
      title={title}
      description={description}
      action={hasMoveUp && moveUp ? <MoveUpBand {...moveUp} /> : undefined}
      actionNote={note}
    />
  );
};
