import { BRAND_VARIANT, SIZE } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { CtaModule } from '@blog/ui/components/organisms/cta-module';
import { useTranslations } from 'next-intl';

export const LookSampleCta = () => {
  const t = useTranslations('lookPreview');

  return (
    <CtaModule.Callout tone={BRAND_VARIANT.PRIMARY} heading={t('ctaHeading')}>
      <CtaModule.Text supportingText={t('ctaText')} />
      <CtaModule.Actions>
        <Button type="button" size={SIZE.SM}>
          {t('subscribeButton')}
        </Button>
      </CtaModule.Actions>
    </CtaModule.Callout>
  );
};
