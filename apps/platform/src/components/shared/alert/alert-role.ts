import { ALERT_TYPE, type TAlertType } from '@shinefold/config';

export type TAlertRole = 'status' | 'alert' | 'note';

export const defaultAlertRole = (type: TAlertType): TAlertRole =>
  type === ALERT_TYPE.ERROR ? 'alert' : 'status';
