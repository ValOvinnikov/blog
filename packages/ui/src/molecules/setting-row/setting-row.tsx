import type { IWithDataTestId } from '@blog/config';
import { Heading, type THeadingProps } from '@blog/ui/atoms/heading';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import {
  settingRowVariants,
  type TSettingRowVariants,
} from './setting-row-variants';

export type TSettingRowProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> &
  IWithDataTestId & {
    label: ReactNode;
    labelLevel?: THeadingProps['level'];
    description?: ReactNode;
    tone?: TSettingRowVariants['tone'];
    children?: ReactNode;
  };

/**
 * SettingRow — a label + description + control-slot row shared by every
 * `/account` section (privacy & data, email preferences, connected
 * accounts). `tone="danger"` marks an irreversible action with the
 * destructive treatment; every other row uses the default tone.
 */
export const SettingRow = ({
  label,
  labelLevel = 3,
  description,
  tone,
  children,
  className,
  dataTestId,
  ...rest
}: TSettingRowProps) => {
  const {
    root,
    content,
    title,
    description: descriptionSlot,
    control,
  } = settingRowVariants({ tone });

  return (
    <div
      {...rest}
      data-testid={dataTestId}
      className={root({ class: className })}
    >
      <div className={content()}>
        <Heading level={labelLevel} className={title()}>
          {label}
        </Heading>
        {description && <p className={descriptionSlot()}>{description}</p>}
      </div>
      {children && <div className={control()}>{children}</div>}
    </div>
  );
};
