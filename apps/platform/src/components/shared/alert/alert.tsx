import { ALERT_TYPE } from '@blog/config';
import { Icon, STATUS_ICON } from '@platform/components/shared/icon';
import type { ReactNode } from 'react';

import { alertVariants, type TAlertVariants } from './alert-variants';

type TAlertType = NonNullable<TAlertVariants['type']>;

export type TAlertProps = {
  type: TAlertType;
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  role?: 'status' | 'alert' | 'note';
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
  } = alertVariants({ type, isNote: role === 'note' });

  return (
    <div id={id} role={role} className={root({ class: className })}>
      <Icon name={STATUS_ICON[type]} className={icon()} />
      <div className={text()}>
        {title && <strong className={titleSlot()}>{title}</strong>}
        {description && <div className={descriptionSlot()}>{description}</div>}
      </div>
      {action && <div className={actionSlot()}>{action}</div>}
    </div>
  );
};
