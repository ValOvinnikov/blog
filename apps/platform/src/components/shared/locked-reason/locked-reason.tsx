import { Field } from '@base-ui/react/field';
import type { IWithClassName } from '@blog/config/types';

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
    <span aria-hidden="true">🔒</span>
    <span>{children}</span>
  </Field.Description>
);
