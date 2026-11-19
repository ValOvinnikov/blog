import { type IWithClassName, TEXT_ROLE } from '@shinefold/config';
import { Prose } from '@shinefold/ui/components/atoms/prose';
import { Text } from '@shinefold/ui/components/atoms/text';
import type { ReactNode } from 'react';

export type TCtaModuleTextProps = IWithClassName & {
  supportingText?: string;
  children?: ReactNode;
};

/** The copy slot under a `CtaModule` heading: a plain supporting line, then rich content set as prose. */
export const CtaModuleText = ({
  supportingText,
  className,
  children,
}: TCtaModuleTextProps) => (
  <>
    {supportingText && (
      <Text textRole={TEXT_ROLE.INTRO} className={className}>
        {supportingText}
      </Text>
    )}
    {children && <Prose className={className}>{children}</Prose>}
  </>
);
