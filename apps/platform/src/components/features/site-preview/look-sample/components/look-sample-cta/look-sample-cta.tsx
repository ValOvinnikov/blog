import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { BRAND_VARIANT, SIZE } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import { CtaModule } from '@shinefold/ui/components/organisms/cta-module';
import { useTranslations } from 'next-intl';

export const LookSampleCta = () => {
  const t = useTranslations('lookPreview');

  return (
    <SamplePart part={SAMPLE_PART.CTA_BOX}>
      <CtaModule.Callout tone={BRAND_VARIANT.PRIMARY} heading={t('ctaHeading')}>
        <CtaModule.Text supportingText={t('ctaText')} />
        <CtaModule.Actions>
          <SamplePart part={SAMPLE_PART.BUTTON}>
            <Button type="button" size={SIZE.SM}>
              {t('subscribeButton')}
            </Button>
          </SamplePart>
        </CtaModule.Actions>
      </CtaModule.Callout>
    </SamplePart>
  );
};
