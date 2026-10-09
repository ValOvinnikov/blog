import { Card } from '@platform/components/shared/card';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import type { ReactNode } from 'react';

import { lookCardVariants } from './look-card-variants';

export type TLookCardProps = {
  title: string;
  description: string;
  hasUnsavedChanges: boolean;
  actions?: ReactNode;
  children: ReactNode;
};

export const LookCard = ({
  title,
  description,
  hasUnsavedChanges,
  actions,
  children,
}: TLookCardProps) => {
  const { title: titleSlot, body } = lookCardVariants();

  return (
    <Card>
      <Card.Header
        title={
          <span className={titleSlot()}>
            {title}
            {hasUnsavedChanges && (
              <>
                {' '}
                <UnsavedDot />
              </>
            )}
          </span>
        }
        supportingText={description}
        actions={actions}
        headingLevel={2}
      />
      <Card.Body className={body()}>{children}</Card.Body>
    </Card>
  );
};
