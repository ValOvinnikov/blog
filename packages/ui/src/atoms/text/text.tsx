import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { CSSProperties, ReactNode } from 'react';

import { textVariants, type TTextVariants } from './text-variants';

export type TTextProps = IWithClassName &
  TTextVariants &
  IWithDataTestId & {
    style?: CSSProperties;
    children?: ReactNode;
  };

/**
 * Text — the body-copy paragraph primitive: applies a `variant` from the type
 * scale to a `<p>`. Use for prose and captions; headings belong to `Heading`.
 */
export const Text = ({
  variant,
  className,
  dataTestId,
  style,
  children,
}: TTextProps) => (
  <p
    className={textVariants({ variant, class: className })}
    data-testid={dataTestId}
    style={style}
  >
    {children}
  </p>
);
