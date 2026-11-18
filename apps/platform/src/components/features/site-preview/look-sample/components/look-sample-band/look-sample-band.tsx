import { LookSampleActions } from '@platform/components/features/site-preview/look-sample/components/look-sample-actions/look-sample-actions';
import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { LOOK_SAMPLE_BAND_TEST_ID } from '@platform/constants/look-sample';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import type { TBrandVariant } from '@shinefold/config';
import { Eyebrow } from '@shinefold/ui/components/atoms/eyebrow';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import { MediaCard } from '@shinefold/ui/components/molecules/media-card';
import { useTranslations } from 'next-intl';

import { lookSampleBandVariants } from './look-sample-band-variants';

export type TLookSampleBandProps = {
  skin: TBrandVariant;
};

export const LookSampleBand = ({ skin }: TLookSampleBandProps) => {
  const t = useTranslations('lookPreview');
  const tLook = useTranslations('lookForm');
  const { root, inner, copy } = lookSampleBandVariants();

  return (
    <div
      data-skin={skin}
      className={root()}
      data-testid={LOOK_SAMPLE_BAND_TEST_ID}
    >
      <div className={inner()}>
        <div className={copy()}>
          <Eyebrow>{tLook(`skinLabel.${skin}`)}</Eyebrow>
          <Heading level={2} visual="section">
            {t('bandHeading')}
          </Heading>
          <Text variant="supporting">{t('bandText')}</Text>
          <TextLink href="#">{t('bandLink')}</TextLink>
          <LookSampleActions />
        </div>
        <SamplePart part={SAMPLE_PART.POST_CARD}>
          <MediaCard isInteractive={true} excerpt={t('bandCardExcerpt')}>
            <MediaCard.Title level={3}>
              <MediaCard.Link href="#">{t('bandCardTitle')}</MediaCard.Link>
            </MediaCard.Title>
          </MediaCard>
        </SamplePart>
      </div>
    </div>
  );
};
