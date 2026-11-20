import type { TPostTakeaways } from '@shinefold/service';
import { getTranslations } from 'next-intl/server';

import { PostSummaryCardView } from './post-summary-card-view';

export interface IPostSummaryCardProps {
  takeaways: TPostTakeaways;
  readingTimeMinutes: number;
}

export const PostSummaryCard = async ({
  takeaways,
  readingTimeMinutes,
}: IPostSummaryCardProps) => {
  const t = await getTranslations('blogPostPage.postSummary');

  return (
    <PostSummaryCardView
      takeaways={takeaways}
      title={t('title')}
      readTime={t('readTime')}
      readFullArticleLabel={t('readFullArticle', {
        count: readingTimeMinutes,
      })}
    />
  );
};
