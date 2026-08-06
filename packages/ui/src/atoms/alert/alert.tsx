import { ALERT_TYPE, ICONS, type IWithDataTestId } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import type { ComponentPropsWithoutRef } from 'react';

import { alertVariants, type TAlertVariants } from './alert-variants';

const ALERT_ICON = {
  [ALERT_TYPE.SUCCESS]: ICONS.CHECK,
  [ALERT_TYPE.WARNING]: ICONS.WARNING,
  [ALERT_TYPE.ERROR]: ICONS.CLOSE,
  [ALERT_TYPE.INFO]: ICONS.INFO,
} as const;

export interface IAlertProps
  extends
    Omit<ComponentPropsWithoutRef<'div'>, 'role' | 'children'>,
    IWithDataTestId {
  type: NonNullable<TAlertVariants['type']>;
  message: string;
}

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
  ...rest
}: IAlertProps) => {
  const role = type === ALERT_TYPE.ERROR ? 'alert' : 'status';

  return (
    <div
      {...rest}
      role={role}
      data-testid={dataTestId}
      className={alertVariants({ type, class: className })}
    >
      <Icon name={ALERT_ICON[type]} />
      <span>{message}</span>
    </div>
  );
};
