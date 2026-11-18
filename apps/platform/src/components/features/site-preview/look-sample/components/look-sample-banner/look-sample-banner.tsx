import { LookSampleImage } from '@platform/components/features/site-preview/look-sample/components/look-sample-image/look-sample-image';
import { LOOK_SAMPLE_BANNER_TEST_ID } from '@platform/constants/look-sample';
import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@shinefold/config';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Text } from '@shinefold/ui/components/atoms/text';
import { bannerVariants } from '@shinefold/ui/lib/styling';
import { useTranslations } from 'next-intl';

import { lookSampleBannerVariants } from './look-sample-banner-variants';

export const LookSampleBanner = () => {
  const t = useTranslations('lookPreview');
  const { root, copy } = lookSampleBannerVariants();
  const { media, overlay, title, text } = bannerVariants({
    position: CONTENT_ALIGNMENT.LEFT,
  });

  return (
    <div
      data-skin={BRAND_VARIANT.BRAND_PRIMARY}
      className={root()}
      data-testid={LOOK_SAMPLE_BANNER_TEST_ID}
    >
      <div className={media()}>
        <LookSampleImage />
      </div>
      <div className={overlay()} aria-hidden="true" />
      <div className={copy()}>
        <Heading level={2} visual="section" className={title()}>
          {t('bannerHeading')}
        </Heading>
        <Text variant="supporting" className={text()}>
          {t('bannerText')}
        </Text>
      </div>
    </div>
  );
};
