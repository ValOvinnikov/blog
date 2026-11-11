import { BRAND_VARIANT, SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { CtaModule } from '@blog/ui/components/organisms/cta-module';
import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { useTranslations } from 'next-intl';

export const LookSampleCta = () => {
  const t = useTranslations('lookPreview');

  return (
    <SamplePart part={SAMPLE_PART.CTA_BOX}>
      <CtaModule.Callout tone={BRAND_VARIANT.PRIMARY} heading={t('ctaHeading')}>
        <CtaModule.Text supportingText={t('ctaText')} />
        <CtaModule.Actions>
          <SamplePart part={SAMPLE_PART.ACTION_BUTTON}>
            <Button type="button" size={SIZE.SM}>
              {t('subscribeButton')}
            </Button>
          </SamplePart>
        </CtaModule.Actions>
      </CtaModule.Callout>
    </SamplePart>
  );
};
