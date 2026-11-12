import { Field } from '@base-ui/react/field';
import { ICONS } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import {
  Icon,
  type TIconProps,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';

import { lockedReasonVariants } from './locked-reason-variants';

export type TLockedReasonProps = IWithClassName & {
  id?: string;
  icon?: TRegisteredIconName;
  iconSize?: TIconProps['size'];
  isFieldDescription?: boolean;
  children: string;
};

export const LockedReason = ({
  id,
  icon = ICONS.LOCK,
  iconSize = ICON_SIZE.MD,
  isFieldDescription = true,
  children,
  className,
}: TLockedReasonProps) => {
  const content = (
    <>
      <Icon name={icon} size={iconSize} />
      <span>{children}</span>
    </>
  );
  const rootClassName = lockedReasonVariants({ class: className });

  return isFieldDescription ? (
    <Field.Description id={id} className={rootClassName}>
      {content}
    </Field.Description>
  ) : (
    <p id={id} className={rootClassName}>
      {content}
    </p>
  );
};
