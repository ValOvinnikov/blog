import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { Card } from '@platform/components/shared/card';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import type { TLookCardKey } from '@platform/utils/look-form-values/look-form-values';
import type { ReactNode } from 'react';

import { lookCardVariants } from './look-card-variants';

export type TLookCardProps = {
  card: TLookCardKey;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
};

export const LookCard = ({
  card,
  title,
  description,
  actions,
  children,
}: TLookCardProps) => {
  const { hasCardChanges } = useLookForm();
  const { title: titleSlot, body } = lookCardVariants();

  return (
    <Card>
      <Card.Header
        title={
          <span className={titleSlot()}>
            {title}
            {hasCardChanges(card) && (
              <>
                {' '}
                <UnsavedDot />
              </>
            )}
          </span>
        }
        supportingText={description}
        actions={actions}
      />
      <Card.Body className={body()}>{children}</Card.Body>
    </Card>
  );
};
