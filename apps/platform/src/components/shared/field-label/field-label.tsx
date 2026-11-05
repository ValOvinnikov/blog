import { Field } from '@base-ui/react/field';
import type { IWithChildren } from '@blog/config/react';
import type { IWithClassName } from '@blog/config/types';

/** A field title that focuses its control on click without activating it, so a select's list stays closed. */
export const FieldLabel = ({
  className,
  children,
}: IWithClassName & IWithChildren) => (
  <Field.Label nativeLabel={false} render={<div />} className={className}>
    {children}
  </Field.Label>
);
