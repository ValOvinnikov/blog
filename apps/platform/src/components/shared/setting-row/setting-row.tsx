import { Field } from '@base-ui/react/field';
import type { ReactNode } from 'react';

import { settingRowVariants } from './setting-row-variants';

export type TSettingRowProps = {
  label: string;
  description?: string;
  isLocked?: boolean;
  lockedReason?: string;
  children: ReactNode;
  className?: string;
};

export const SettingRow = ({
  label,
  description,
  isLocked = false,
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
  } = settingRowVariants();

  return (
    <Field.Root className={root({ class: className })}>
      <div className={content()}>
        <span className={labelSlot()}>{label}</span>
        {description && (
          <Field.Description className={descriptionSlot()}>
            {description}
          </Field.Description>
        )}
        {isLocked && lockedReason && (
          <Field.Description className={reason()}>
            <span aria-hidden="true">🔒</span>
            <span>{lockedReason}</span>
          </Field.Description>
        )}
      </div>
      <div className={control()}>{children}</div>
    </Field.Root>
  );
};
