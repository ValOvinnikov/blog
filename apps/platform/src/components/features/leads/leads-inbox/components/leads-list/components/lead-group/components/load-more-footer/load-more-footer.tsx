import type { TLeadsLoading } from '@platform/components/features/leads/leads-inbox/use-leads-pages';
import { Button } from '@platform/components/shared/button';
import { Spinner } from '@platform/components/shared/spinner';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { SIZE } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { loadMoreFooterVariants } from './load-more-footer-variants';

export type TLoadMoreFooterProps = {
  loading: TLeadsLoading;
};

export const LoadMoreFooter = ({ loading }: TLoadMoreFooterProps) => {
  const t = useTranslations('leadsInbox');
  const { isLoading, hasLoadFailed, loadMore } = loading;

  if (!isLoading && !hasLoadFailed) return null;

  return (
    <div className={loadMoreFooterVariants()}>
      {isLoading ? (
        <Spinner label={t('loadingMore')} hasLabel={true} />
      ) : (
        <Button
          size={SIZE.SM}
          variant={BUTTON_VARIANT.SECONDARY}
          onClick={loadMore}
        >
          {t('loadMoreFailed')}
        </Button>
      )}
    </div>
  );
};
