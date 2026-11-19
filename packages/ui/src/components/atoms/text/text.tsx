import {
  type DD_AS_CONST,
  type DIV_AS_CONST,
  type DT_AS_CONST,
  type FIGCAPTION_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
  type LI_AS_CONST,
  P_AS_CONST,
  type SPAN_AS_CONST,
  type TTextRole,
} from '@shinefold/config';
import type { CSSProperties, ReactNode } from 'react';

import { textVariants, type TTextVariants } from './text-variants';

type TTextElement =
  | typeof P_AS_CONST
  | typeof SPAN_AS_CONST
  | typeof DIV_AS_CONST
  | typeof DT_AS_CONST
  | typeof DD_AS_CONST
  | typeof LI_AS_CONST
  | typeof FIGCAPTION_AS_CONST;

export type TTextProps = IWithClassName &
  IWithDataTestId & {
    as?: TTextElement;
    textRole?: TTextRole;
    variant?: TTextVariants['variant'];
    style?: CSSProperties;
    children?: ReactNode;
  };

const DEFAULT_VARIANT: NonNullable<TTextVariants['variant']> = 'lead';

/** Renders any text role, or a legacy variant, in a non-heading element. */
export const Text = ({
  as: Tag = P_AS_CONST,
  textRole,
  variant,
  className,
  dataTestId,
  style,
  children,
}: TTextProps) => (
  <Tag
    className={textVariants({
      textRole,
      variant: textRole ? undefined : (variant ?? DEFAULT_VARIANT),
      class: className,
    })}
    data-testid={dataTestId}
    style={style}
  >
    {children}
  </Tag>
);
