import { Field } from '@base-ui/react/field';
import { ICONS } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import {
  Icon,
  type TRegisteredIconName,
} from '@platform/components/shared/icon';

import { lockedReasonVariants } from './locked-reason-variants';

export type TLockedReasonProps = IWithClassName & {
  id?: string;
  icon?: TRegisteredIconName;
  children: string;
};

export const LockedReason = ({
  id,
  icon = ICONS.LOCK,
  children,
  className,
}: TLockedReasonProps) => (
  <Field.Description
    id={id}
    className={lockedReasonVariants({ class: className })}
  >
    <Icon name={icon} />
    <span>{children}</span>
  </Field.Description>
);
