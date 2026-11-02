import { Heading } from '@blog/ui/components/atoms/heading';
import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { lookSamplePostsVariants } from './look-sample-posts-variants';

const FIRST_POST_DATE = '2026-10-12';
const SECOND_POST_DATE = '2026-09-28';

export const LookSamplePosts = () => {
  const t = useTranslations('lookPreview');
  const headingId = useId();
  const { root, heading, cards } = lookSamplePostsVariants();
  const readingTime = t('readTimeChip');

  return (
    <section aria-labelledby={headingId} className={root()}>
      <Heading level={2} visual="preview" id={headingId} className={heading()}>
        {t('latestPostsHeading')}
      </Heading>
      <div className={cards()}>
        <MediaCard isInteractive={true} excerpt={t('firstCardExcerpt')}>
          <MediaCard.Meta
            dateValue={FIRST_POST_DATE}
            dateLabel={t('firstCardDate')}
            readingTime={readingTime}
          />
          <MediaCard.Title level={3}>
            <MediaCard.Link href="#">{t('firstCardTitle')}</MediaCard.Link>
          </MediaCard.Title>
        </MediaCard>
        <MediaCard isInteractive={false} excerpt={t('secondCardExcerpt')}>
          <MediaCard.Meta
            dateValue={SECOND_POST_DATE}
            dateLabel={t('secondCardDate')}
            readingTime={readingTime}
          />
          <MediaCard.Title level={3}>{t('secondCardTitle')}</MediaCard.Title>
        </MediaCard>
      </div>
    </section>
  );
};
