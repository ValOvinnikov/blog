import { Card } from '@platform/components/shared/card';
import { cardVariants } from '@platform/components/shared/card/card-variants';
import { detailListVariants } from '@platform/components/shared/detail-list/detail-list-variants';
import { Skeleton } from '@platform/components/shared/skeleton';
import { Fragment } from 'react';

import { domainCardSkeletonVariants } from './domain-card-skeleton-variants';

const ROW_KEYS = ['domain', 'last-checked'];

export const DomainCardSkeleton = () => {
  const { title, badge, action, term, value } = domainCardSkeletonVariants();
  const { header: cardHeader, headerActions, body: cardBody } = cardVariants();
  const { root: detailList } = detailListVariants();

  return (
    <Card>
      <div className={cardHeader()}>
        <Skeleton className={title()} />
        <div className={headerActions()}>
          <Skeleton className={badge()} />
          <Skeleton className={action()} />
        </div>
      </div>
      <div className={cardBody()}>
        <div className={detailList()}>
          {ROW_KEYS.map((key) => (
            <Fragment key={key}>
              <Skeleton className={term()} />
              <Skeleton className={value()} />
            </Fragment>
          ))}
        </div>
      </div>
    </Card>
  );
};
