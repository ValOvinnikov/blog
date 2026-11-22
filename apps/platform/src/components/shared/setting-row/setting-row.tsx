import { Field } from '@base-ui/react/field';
import { textVariants } from '@platform/components/shared/text/text-variants';
import type { ReactNode } from 'react';

import { settingRowVariants } from './setting-row-variants';

export type TSettingRowProps = {
  label: string;
  description?: string;
  isNested?: boolean;
  status?: ReactNode;
  error?: string;
  children: ReactNode;
  className?: string;
};

export const SettingRow = ({
  label,
  description,
  isNested = false,
  status,
  error,
  children,
  className,
}: TSettingRowProps) => {
  const {
    root,
    content,
    label: labelSlot,
    description: descriptionSlot,
    control,
    error: errorSlot,
  } = settingRowVariants({ isNested });

  return (
    <Field.Root className={root({ class: className })} invalid={Boolean(error)}>
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
        {status}
        {error && (
          <Field.Error match={true} className={errorSlot()}>
            {error}
          </Field.Error>
        )}
      </div>
      <div className={control()}>{children}</div>
    </Field.Root>
  );
};
