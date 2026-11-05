import { ALERT_TYPE, ICONS, type TAlertType } from '@blog/config';

import type { TRegisteredIconName } from './icon-registry';

export const STATUS_ICON = {
  [ALERT_TYPE.SUCCESS]: ICONS.CHECK,
  [ALERT_TYPE.WARNING]: ICONS.WARNING,
  [ALERT_TYPE.ERROR]: ICONS.CLOSE,
  [ALERT_TYPE.INFO]: ICONS.INFO,
} as const satisfies Record<TAlertType, TRegisteredIconName>;
