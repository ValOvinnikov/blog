import { Card } from '@platform/components/shared/card';
import { cardVariants } from '@platform/components/shared/card/card-variants';
import { pageHeaderVariants } from '@platform/components/shared/page-header/page-header-variants';
import { Skeleton } from '@platform/components/shared/skeleton';
import { useTranslations } from 'next-intl';

import { pageSkeletonVariants } from './page-skeleton-variants';

const ROW_KEYS = ['row-1', 'row-2', 'row-3', 'row-4', 'row-5'];

export const PageSkeleton = () => {
  const t = useTranslations('pageSkeleton');
  const {
    root,
    status,
    title,
    description,
    cardTitle,
    row,
    primaryCell,
    secondaryCell,
    badgeCell,
  } = pageSkeletonVariants();
  const { root: headerRoot, titleGroup } = pageHeaderVariants();
  const { header: cardHeader, body: cardBody } = cardVariants();

  return (
    <div className={root()}>
      <span role="status" className={status()}>
        {t('label')}
      </span>
      <div className={headerRoot()}>
        <div className={titleGroup()}>
          <Skeleton className={title()} />
          <Skeleton className={description()} />
        </div>
      </div>
      <Card>
        <div className={cardHeader()}>
          <Skeleton className={cardTitle()} />
        </div>
        <div className={cardBody()}>
          {ROW_KEYS.map((key) => (
            <div key={key} className={row()}>
              <Skeleton className={primaryCell()} />
              <Skeleton className={secondaryCell()} />
              <Skeleton className={badgeCell()} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
