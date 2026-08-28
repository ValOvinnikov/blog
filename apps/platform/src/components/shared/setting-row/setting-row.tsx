import type { ReactNode } from 'react';

import {
  settingRowVariants,
  type TSettingRowVariants,
} from './setting-row-variants';

export type TSettingRowProps = {
  label: string;
  description?: string;
  /** Plan-gated or provisioning-locked rows read the same: a faded control plus a visible reason. */
  isLocked?: TSettingRowVariants['isLocked'];
  lockedReason?: string;
  /** The right-aligned control — a switch, segmented control, picker, or any other interactive element. */
  children: ReactNode;
  className?: string;
};

export const SettingRow = ({
  label,
  description,
  isLocked,
  lockedReason,
  children,
  className,
}: TSettingRowProps) => {
  const {
    root,
    content,
    label: labelSlot,
    description: descriptionSlot,
    reason,
    control,
  } = settingRowVariants({ isLocked });

  return (
    <div className={root({ class: className })}>
      <div className={content()}>
        <span className={labelSlot()}>{label}</span>
        {description && (
          <span className={descriptionSlot()}>{description}</span>
        )}
        {isLocked && lockedReason && (
          <span className={reason()}>
            <span aria-hidden="true">🔒</span>
            <span>{lockedReason}</span>
          </span>
        )}
      </div>
      <div className={control()} inert={isLocked || undefined}>
        {children}
      </div>
    </div>
  );
};
