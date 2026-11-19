import { LookSampleImage } from '@platform/components/features/site-preview/look-sample/components/look-sample-image/look-sample-image';
import { LookSampleSection } from '@platform/components/features/site-preview/look-sample/components/look-sample-section/look-sample-section';
import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { SAMPLE_LINK_HREF } from '@platform/constants/sample-link';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { MediaCard } from '@shinefold/ui/components/molecules/media-card';
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
          <MediaCard
            isLead={true}
            isInteractive={true}
            excerpt={t('firstCardExcerpt')}
          >
            <MediaCard.Media>
              <LookSampleImage part={SAMPLE_PART.POST_IMAGE} />
            </MediaCard.Media>
            <MediaCard.Meta
              dateValue={FIRST_POST_DATE}
              dateLabel={t('firstCardDate')}
              readingTime={readingTime}
            />
            <MediaCard.Title level={3}>
              <MediaCard.Link href={SAMPLE_LINK_HREF}>
                {t('firstCardTitle')}
              </MediaCard.Link>
            </MediaCard.Title>
          </MediaCard>
        </SamplePart>
        <SamplePart part={SAMPLE_PART.POST_CARD}>
          <MediaCard isInteractive={false} excerpt={t('secondCardExcerpt')}>
            <MediaCard.Media>
              <LookSampleImage part={SAMPLE_PART.POST_IMAGE} />
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
