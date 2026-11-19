import { Card } from '@platform/components/shared/card';
import type { THeadingLevel } from '@platform/components/shared/heading';
import { Text } from '@platform/components/shared/text';
import type { ReactNode } from 'react';

export type TDataTableShellTitleProps = {
  id: string;
  count: ReactNode;
  supportingText?: ReactNode;
  headingLevel?: THeadingLevel;
  children: ReactNode;
};

export const DataTableShellTitle = ({
  id,
  count,
  supportingText,
  headingLevel,
  children,
}: TDataTableShellTitleProps) => (
  <Card.Header
    title={children}
    titleId={id}
    titleTabIndex={-1}
    supportingText={supportingText}
    headingLevel={headingLevel}
    actions={
      <Text as="span" variant="meta">
        {count}
      </Text>
    }
  />
);
