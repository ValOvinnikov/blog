import type { IWithDataTestId } from '@blog/config';
import { type HTMLAttributes } from 'react';

import { textVariants, type TTextVariants } from './text-variants';

export type TTextProps = HTMLAttributes<HTMLParagraphElement> &
  TTextVariants &
  IWithDataTestId;

/**
 * Text — the body-copy paragraph primitive: applies a `variant` from the type
 * scale to a `<p>`. Use for prose and captions; headings belong to `Heading`.
 */
export const Text = ({
  variant,
  className,
  dataTestId,
  ...rest
}: TTextProps) => (
  <p
    className={textVariants({ variant, class: className })}
    data-testid={dataTestId}
    {...rest}
  />
);
