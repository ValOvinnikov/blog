import { Card } from '@platform/components/shared/card';
import { Text } from '@platform/components/shared/text';
import type { ReactNode } from 'react';

export type TDataTableShellTitleProps = {
  id: string;
  count: ReactNode;
  supportingText?: ReactNode;
  children: ReactNode;
};

export const DataTableShellTitle = ({
  id,
  count,
  supportingText,
  children,
}: TDataTableShellTitleProps) => (
  <Card.Header
    title={children}
    titleId={id}
    titleTabIndex={-1}
    supportingText={supportingText}
    actions={
      <Text as="span" variant="meta">
        {count}
      </Text>
    }
  />
);
