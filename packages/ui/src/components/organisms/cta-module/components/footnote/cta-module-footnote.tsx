import {
  type IWithClassName,
  type IWithDataTestId,
  TEXT_ROLE,
} from '@shinefold/config';
import { Text } from '@shinefold/ui/components/atoms/text';
import type { ReactNode } from 'react';

export type TCtaModuleFootnoteProps = IWithClassName &
  IWithDataTestId & { children?: ReactNode };

/** The fine-print slot under a `CtaModule`'s actions. */
export const CtaModuleFootnote = ({
  className,
  dataTestId,
  children,
}: TCtaModuleFootnoteProps) => (
  <Text
    textRole={TEXT_ROLE.FOOTNOTE}
    className={className}
    dataTestId={dataTestId}
  >
    {children}
  </Text>
);
