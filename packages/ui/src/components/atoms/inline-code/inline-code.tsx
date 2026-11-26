import type { IWithClassName, IWithDataTestId } from '@shinefold/config';
import type { ReactNode } from 'react';

import { inlineCodeVariants } from './inline-code-variants';

export type TInlineCodeProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/** A code token set inside running text. */
export const InlineCode = ({
  className,
  children,
  dataTestId,
}: TInlineCodeProps) => {
  return (
    <code
      className={inlineCodeVariants({ class: className })}
      data-testid={dataTestId}
    >
      {children}
    </code>
  );
};
