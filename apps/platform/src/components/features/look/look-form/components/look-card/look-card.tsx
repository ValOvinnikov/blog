import { Card } from '@platform/components/shared/card';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations('lookForm');
  const { title: titleSlot, dot, srOnly, body } = lookCardVariants();

  return (
    <Card>
      <Card.Header
        title={
          <span className={titleSlot()}>
            {title}
            {hasUnsavedChanges && (
              <>
                {' '}
                <span className={dot()}>
                  <span className={srOnly()}>{t('unsavedCard')}</span>
                </span>
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
