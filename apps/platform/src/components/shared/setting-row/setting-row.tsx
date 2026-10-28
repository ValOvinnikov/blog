import { Field } from '@base-ui/react/field';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { textVariants } from '@platform/components/shared/text/text-variants';
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
    control,
  } = settingRowVariants();

  return (
    <Field.Root className={root({ class: className })}>
      <div className={content()}>
        <span className={labelSlot()}>{label}</span>
        {description && (
          <Field.Description
            className={textVariants({
              variant: 'hint',
              class: descriptionSlot(),
            })}
          >
            {description}
          </Field.Description>
        )}
        {isLocked && lockedReason && (
          <LockedReason>{lockedReason}</LockedReason>
        )}
      </div>
      <div className={control()}>{children}</div>
    </Field.Root>
  );
};
