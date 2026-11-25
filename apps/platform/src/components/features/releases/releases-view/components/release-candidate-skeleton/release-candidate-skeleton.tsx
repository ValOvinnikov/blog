import { DetailCardSkeleton } from '@platform/components/shared/detail-card-skeleton';
import { useTranslations } from 'next-intl';

import { releaseCandidateSkeletonVariants } from './release-candidate-skeleton-variants';

export const ReleaseCandidateSkeleton = () => {
  const t = useTranslations('pageSkeleton');
  const { status } = releaseCandidateSkeletonVariants();

  return (
    <>
      <span role="status" className={status()}>
        {t('label')}
      </span>
      <DetailCardSkeleton rowCount={3} />
      <DetailCardSkeleton rowCount={4} />
    </>
  );
};
