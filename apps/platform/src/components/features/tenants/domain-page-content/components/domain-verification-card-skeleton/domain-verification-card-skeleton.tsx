import { Card } from '@platform/components/shared/card';
import { cardVariants } from '@platform/components/shared/card/card-variants';
import { Skeleton } from '@platform/components/shared/skeleton';

import { domainVerificationCardSkeletonVariants } from './domain-verification-card-skeleton-variants';

const ROW_KEYS = ['row-1', 'row-2'];

export const DomainVerificationCardSkeleton = () => {
  const { title, badge, hint, copy, row, typeCell, nameCell, valueCell } =
    domainVerificationCardSkeletonVariants();
  const { header: cardHeader, headerActions, body: cardBody } = cardVariants();

  return (
    <Card>
      <div className={cardHeader()}>
        <Skeleton className={title()} />
        <div className={headerActions()}>
          <Skeleton className={badge()} />
          <Skeleton className={hint()} />
        </div>
      </div>
      <div className={cardBody()}>
        <Skeleton className={copy()} />
        {ROW_KEYS.map((key) => (
          <div key={key} className={row()}>
            <Skeleton className={typeCell()} />
            <Skeleton className={nameCell()} />
            <Skeleton className={valueCell()} />
          </div>
        ))}
      </div>
    </Card>
  );
};
