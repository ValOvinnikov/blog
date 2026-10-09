import { ALERT_TYPE, ICONS, SIZE } from '@blog/config';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import type { ReactNode } from 'react';

import { alertVariants, type TAlertVariants } from './alert-variants';

type TAlertType = NonNullable<TAlertVariants['type']>;

const ALERT_ICON = {
  [ALERT_TYPE.SUCCESS]: ICONS.CHECK,
  [ALERT_TYPE.WARNING]: ICONS.WARNING,
  [ALERT_TYPE.ERROR]: ICONS.CLOSE,
  [ALERT_TYPE.INFO]: ICONS.INFO,
} as const satisfies Record<TAlertType, TRegisteredIconName>;

export type TAlertProps = {
  type: TAlertType;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  role?: 'status' | 'alert';
  id?: string;
  className?: string;
};

export const Alert = ({
  type,
  title,
  description,
  action,
  role = type === ALERT_TYPE.ERROR ? 'alert' : 'status',
  id,
  className,
}: TAlertProps) => {
  const {
    root,
    icon,
    text,
    title: titleSlot,
    description: descriptionSlot,
    action: actionSlot,
  } = alertVariants({ type });

  return (
    <div id={id} role={role} className={root({ class: className })}>
      <Icon name={ALERT_ICON[type]} size={SIZE.SM} className={icon()} />
      <div className={text()}>
        {title && <strong className={titleSlot()}>{title}</strong>}
        {description && <div className={descriptionSlot()}>{description}</div>}
      </div>
      {action && <div className={actionSlot()}>{action}</div>}
    </div>
  );
};
