import type { IWithDataTestId } from '@blog/config';
import type { HTMLAttributes } from 'react';

import { inlineCodeVariants } from './inline-code-variants';

export type TInlineCodeProps = HTMLAttributes<HTMLElement> & IWithDataTestId;

/**
 * InlineCode atom — a single `<code>` token styled for inline use within
 * running text (e.g. Portable Text `code` marks). For fenced/multi-line code
 * blocks, use a dedicated block-level component instead.
 */
export const InlineCode = ({
  className,
  dataTestId,
  ...rest
}: TInlineCodeProps) => {
  return (
    <code
      className={inlineCodeVariants({ class: className })}
      data-testid={dataTestId}
      {...rest}
    />
  );
};
