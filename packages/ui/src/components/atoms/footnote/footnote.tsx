import {
  type IWithClassName,
  type IWithDataTestId,
  TEXT_ROLE,
} from '@shinefold/config';
import { Text } from '@shinefold/ui/components/atoms/text';
import type { ReactNode } from 'react';

export type TFootnoteProps = IWithClassName &
  IWithDataTestId & { children?: ReactNode };

/** The fine-print line an organism sets under its actions. */
export const Footnote = ({
  className,
  dataTestId,
  children,
}: TFootnoteProps) => (
  <Text
    textRole={TEXT_ROLE.FOOTNOTE}
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </Text>
);
