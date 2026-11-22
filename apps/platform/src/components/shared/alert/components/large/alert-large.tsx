import { alertVariants } from '@platform/components/shared/alert/alert-variants';
import { Heading } from '@platform/components/shared/heading';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { ALERT_TYPE, type TAlertType } from '@shinefold/config';
import type { ReactNode } from 'react';

export type TAlertLargeProps = {
  type: TAlertType;
  icon: TRegisteredIconName;
  title?: string;
  description: ReactNode;
  action?: ReactNode;
  actionNote?: string;
};

export const AlertLarge = ({
  type,
  icon,
  title,
  description,
  action,
  actionNote,
}: TAlertLargeProps) => {
  const {
    root,
    icon: iconSlot,
    text,
    title: titleSlot,
    description: descriptionSlot,
    action: actionSlot,
    actionNote: actionNoteSlot,
  } = alertVariants({ type, isLarge: true, hasTitle: Boolean(title) });

  return (
    <div
      role={type === ALERT_TYPE.ERROR ? 'alert' : 'status'}
      className={root()}
    >
      <Icon name={icon} className={iconSlot()} />
      <div className={text()}>
        {title && (
          <Heading level={2} size="cardTitle" className={titleSlot()}>
            {title}
          </Heading>
        )}
        <div className={descriptionSlot()}>{description}</div>
        {(action || actionNote) && (
          <div className={actionSlot()}>
            {action}
            {actionNote && <p className={actionNoteSlot()}>{actionNote}</p>}
          </div>
        )}
      </div>
    </div>
  );
};
