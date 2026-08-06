import { ALERT_TONE, type IWithDataTestId } from '@blog/config';
import type { ComponentPropsWithoutRef } from 'react';

import { alertVariants, type TAlertVariants } from './alert-variants';

export interface IAlertProps
  extends Omit<ComponentPropsWithoutRef<'div'>, 'role'>, IWithDataTestId {
  tone: NonNullable<TAlertVariants['tone']>;
}

/**
 * Alert — a static, tone-coded inline message block for form feedback
 * (confirmations, warnings, and errors). Announces itself assertively for
 * the ERROR tone and politely for every other tone.
 */
export const Alert = ({
  tone,
  className,
  dataTestId,
  children,
  ...rest
}: IAlertProps) => {
  const role = tone === ALERT_TONE.ERROR ? 'alert' : 'status';

  return (
    <div
      {...rest}
      role={role}
      data-testid={dataTestId}
      className={alertVariants({ tone, class: className })}
    >
      {children}
    </div>
  );
};
