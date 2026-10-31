import { Field } from '@base-ui/react/field';
import { ICONS } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import { Icon } from '@platform/components/shared/icon';

import { lockedReasonVariants } from './locked-reason-variants';

export type TLockedReasonProps = IWithClassName & {
  id?: string;
  children: string;
};

export const LockedReason = ({
  id,
  children,
  className,
}: TLockedReasonProps) => (
  <Field.Description
    id={id}
    className={lockedReasonVariants({ class: className })}
  >
    <Icon name={ICONS.LOCK} />
    <span>{children}</span>
  </Field.Description>
);
