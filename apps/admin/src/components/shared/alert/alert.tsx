import { ALERT_TYPE } from '@blog/config';

import { alertVariants, type TAlertVariants } from './alert-variants';

const ALERT_GLYPH: Record<NonNullable<TAlertVariants['type']>, string> = {
  [ALERT_TYPE.SUCCESS]: '✓',
  [ALERT_TYPE.WARNING]: '◐',
  [ALERT_TYPE.ERROR]: '!',
  [ALERT_TYPE.INFO]: 'i',
};

export type TAlertProps = {
  type: NonNullable<TAlertVariants['type']>;
  title: string;
  description?: string;
  className?: string;
};

export const Alert = ({ type, title, description, className }: TAlertProps) => {
  const {
    root,
    glyph,
    text,
    title: titleSlot,
    description: descriptionSlot,
  } = alertVariants({ type });
  const role = type === ALERT_TYPE.ERROR ? 'alert' : 'status';

  return (
    <div role={role} className={root({ class: className })}>
      <span className={glyph()} aria-hidden="true">
        {ALERT_GLYPH[type]}
      </span>
      <div className={text()}>
        <strong className={titleSlot()}>{title}</strong>
        {description && (
          <span className={descriptionSlot()}>{description}</span>
        )}
      </div>
    </div>
  );
};
