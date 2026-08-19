import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ReactNode } from 'react';

import { inlineCodeVariants } from './inline-code-variants';

export type TInlineCodeProps = IWithClassName &
  IWithDataTestId & {
    children?: ReactNode;
  };

/**
 * InlineCode atom — a single `<code>` token styled for inline use within
 * running text (e.g. Portable Text `code` marks). For fenced/multi-line code
 * blocks, use a dedicated block-level component instead.
 */
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
