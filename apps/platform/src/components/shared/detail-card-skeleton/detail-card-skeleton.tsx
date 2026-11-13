import { Card } from '@platform/components/shared/card';
import { cardVariants } from '@platform/components/shared/card/card-variants';
import { detailListVariants } from '@platform/components/shared/detail-list/detail-list-variants';
import { Skeleton } from '@platform/components/shared/skeleton';
import { Fragment } from 'react';

import { detailCardSkeletonVariants } from './detail-card-skeleton-variants';

export type TDetailCardSkeletonProps = {
  rowCount: number;
  isStackedToLg?: boolean;
};

export const DetailCardSkeleton = ({
  rowCount,
  isStackedToLg = false,
}: TDetailCardSkeletonProps) => {
  const { title, action, term, value } = detailCardSkeletonVariants();
  const { header: cardHeader, headerActions, body: cardBody } = cardVariants();
  const { root: detailList } = detailListVariants({ isStackedToLg });
  const rows = Array.from({ length: rowCount }, (_, index) => index);

  return (
    <Card>
      <div className={cardHeader()}>
        <Skeleton className={title()} />
        <div className={headerActions()}>
          <Skeleton className={action()} />
        </div>
      </div>
      <div className={cardBody()}>
        <div className={detailList()}>
          {rows.map((row) => (
            <Fragment key={row}>
              <Skeleton className={term()} />
              <Skeleton className={value()} />
            </Fragment>
          ))}
        </div>
      </div>
    </Card>
  );
};
