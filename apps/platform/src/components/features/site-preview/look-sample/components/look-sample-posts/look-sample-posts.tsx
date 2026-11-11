import { MediaCard } from '@blog/ui/components/molecules/media-card';
import { LookSamplePostImage } from '@platform/components/features/site-preview/look-sample/components/look-sample-posts/components/look-sample-post-image/look-sample-post-image';
import { LookSampleSection } from '@platform/components/features/site-preview/look-sample/components/look-sample-section/look-sample-section';
import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { useTranslations } from 'next-intl';

import { lookSamplePostsVariants } from './look-sample-posts-variants';

const FIRST_POST_DATE = '2026-10-12';
const SECOND_POST_DATE = '2026-09-28';

export const LookSamplePosts = () => {
  const t = useTranslations('lookPreview');
  const { cards } = lookSamplePostsVariants();
  const readingTime = t('readTimeChip');

  return (
    <LookSampleSection heading={t('latestPostsHeading')}>
      <div className={cards()}>
        <SamplePart part={SAMPLE_PART.POST_CARD}>
          <MediaCard isInteractive={true} excerpt={t('firstCardExcerpt')}>
            <MediaCard.Media>
              <LookSamplePostImage />
            </MediaCard.Media>
            <MediaCard.Meta
              dateValue={FIRST_POST_DATE}
              dateLabel={t('firstCardDate')}
              readingTime={readingTime}
            />
            <MediaCard.Title level={3}>
              <MediaCard.Link href="#">{t('firstCardTitle')}</MediaCard.Link>
            </MediaCard.Title>
          </MediaCard>
        </SamplePart>
        <SamplePart part={SAMPLE_PART.POST_CARD}>
          <MediaCard isInteractive={false} excerpt={t('secondCardExcerpt')}>
            <MediaCard.Media>
              <LookSamplePostImage />
            </MediaCard.Media>
            <MediaCard.Meta
              dateValue={SECOND_POST_DATE}
              dateLabel={t('secondCardDate')}
              readingTime={readingTime}
            />
            <MediaCard.Title level={3}>{t('secondCardTitle')}</MediaCard.Title>
          </MediaCard>
        </SamplePart>
      </div>
    </LookSampleSection>
  );
};
