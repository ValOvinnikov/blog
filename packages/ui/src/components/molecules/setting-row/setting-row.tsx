import {
  TEXT_ROLE,
  type IWithClassName,
  type IWithDataTestId,
} from '@shinefold/config';
import {
  Heading,
  type THeadingProps,
} from '@shinefold/ui/components/atoms/heading';
import type { PropsWithChildren, ReactNode } from 'react';

import {
  settingRowVariants,
  type TSettingRowVariants,
} from './setting-row-variants';

export type TSettingRowProps = PropsWithChildren<
  IWithClassName &
    IWithDataTestId & {
      label: ReactNode;
      labelLevel?: THeadingProps['level'];
      description?: ReactNode;
      tone?: TSettingRowVariants['tone'];
    }
>;

/** One labelled setting in a settings list, with an optional description and a slot for its controls. */
export const SettingRow = ({
  label,
  labelLevel = 3,
  description,
  tone,
  children,
  className,
  dataTestId,
}: TSettingRowProps) => {
  const {
    root,
    content,
    title,
    description: descriptionSlot,
    control,
  } = settingRowVariants({ tone });

  return (
    <div data-testid={dataTestId} className={root({ class: className })}>
      <div className={content()}>
        <Heading
          level={labelLevel}
          visual={TEXT_ROLE.CARD_TITLE}
          className={title()}
        >
          {label}
        </Heading>
        {description && <p className={descriptionSlot()}>{description}</p>}
      </div>
      {children && <div className={control()}>{children}</div>}
    </div>
  );
};
