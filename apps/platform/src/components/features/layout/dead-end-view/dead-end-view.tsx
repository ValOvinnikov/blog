import { BrandMark } from '@platform/components/shared/brand-mark';
import { Card } from '@platform/components/shared/card';
import { Heading } from '@platform/components/shared/heading';
import {
  StatusBadge,
  type TStatusBadgeProps,
} from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { deadEndViewVariants } from './dead-end-view-variants';

export type TDeadEndViewProps = {
  badge: { label: string; tone: TStatusBadgeProps['tone'] };
  title: string;
  description: string;
  action: ReactNode;
  errorId?: string;
};

export const DeadEndView = ({
  badge,
  title,
  description,
  action,
  errorId,
}: TDeadEndViewProps) => {
  const t = useTranslations('deadEndView');
  const {
    root,
    main,
    brand,
    brandName,
    card,
    content,
    copy,
    actions,
    errorId: errorIdSlot,
  } = deadEndViewVariants();

  return (
    <div className={root()}>
      <main className={main()}>
        <div className={brand()}>
          <BrandMark />
          <span className={brandName()}>{t('brandName')}</span>
        </div>
        <Card className={card()}>
          <Card.Body>
            <div className={content()}>
              <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge>
              <div className={copy()}>
                <Heading level={1} size="pageTitle">
                  {title}
                </Heading>
                <Text variant="supporting">{description}</Text>
              </div>
              <div className={actions()}>{action}</div>
              {errorId && (
                <Text variant="meta" className={errorIdSlot()}>
                  {t('errorId', { errorId })}
                </Text>
              )}
            </div>
          </Card.Body>
        </Card>
      </main>
    </div>
  );
};
