import { PreShellFrame } from '@platform/components/features/layout/pre-shell-frame';
import { PageHeader } from '@platform/components/shared/page-header';
import { Text } from '@platform/components/shared/text';
import type { ReactNode } from 'react';

import { deadEndViewVariants } from './dead-end-view-variants';

export type TDeadEndViewProps = {
  title: string;
  description: string;
  action: ReactNode;
};

export const DeadEndView = ({
  title,
  description,
  action,
}: TDeadEndViewProps) => {
  const { content } = deadEndViewVariants();

  return (
    <PreShellFrame header={<PageHeader title={title} />}>
      <div className={content()}>
        <Text variant="supporting">{description}</Text>
        {action}
      </div>
    </PreShellFrame>
  );
};
