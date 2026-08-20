import {
  ALERT_TYPE,
  ICONS,
  type IWithClassName,
  type IWithDataTestId,
} from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';

import { alertVariants, type TAlertVariants } from './alert-variants';

const ALERT_ICON = {
  [ALERT_TYPE.SUCCESS]: ICONS.CHECK,
  [ALERT_TYPE.WARNING]: ICONS.WARNING,
  [ALERT_TYPE.ERROR]: ICONS.CLOSE,
  [ALERT_TYPE.INFO]: ICONS.INFO,
} as const;

export type TAlertProps = IWithClassName &
  IWithDataTestId & {
    type: NonNullable<TAlertVariants['type']>;
    message: string;
    id?: string;
  };

/**
 * Alert — a static, type-coded inline message block for form feedback
 * (confirmations, warnings, and errors). Renders its own icon per type and
 * announces itself assertively for the ERROR type and politely for every
 * other type.
 */
export const Alert = ({
  type,
  message,
  className,
  dataTestId,
  id,
}: TAlertProps) => {
  const role = type === ALERT_TYPE.ERROR ? 'alert' : 'status';

  return (
    <div
      id={id}
      role={role}
      data-testid={dataTestId}
      className={alertVariants({ type, class: className })}
    >
      <Icon name={ALERT_ICON[type]} />
      <span>{message}</span>
    </div>
  );
};
