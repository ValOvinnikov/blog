import { Accordion } from '@blog/ui/components/organisms/accordion';
import { LookSampleSection } from '@platform/components/features/site-preview/look-sample/components/look-sample-section/look-sample-section';
import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { LOOK_SAMPLE_FAQ_ITEM } from '@platform/constants/look-sample';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { useTranslations } from 'next-intl';

export const LookSampleFaq = () => {
  const t = useTranslations('lookPreview');

  return (
    <LookSampleSection heading={t('faqHeading')}>
      <Accordion defaultValue={[LOOK_SAMPLE_FAQ_ITEM.FIRST]}>
        <SamplePart part={SAMPLE_PART.FAQ_ITEM}>
          <Accordion.Item value={LOOK_SAMPLE_FAQ_ITEM.FIRST}>
            <Accordion.Trigger>{t('faqFirstQuestion')}</Accordion.Trigger>
            <Accordion.Panel>{t('faqFirstAnswer')}</Accordion.Panel>
          </Accordion.Item>
        </SamplePart>
        <SamplePart part={SAMPLE_PART.FAQ_ITEM}>
          <Accordion.Item value={LOOK_SAMPLE_FAQ_ITEM.SECOND}>
            <Accordion.Trigger>{t('faqSecondQuestion')}</Accordion.Trigger>
            <Accordion.Panel>{t('faqSecondAnswer')}</Accordion.Panel>
          </Accordion.Item>
        </SamplePart>
      </Accordion>
    </LookSampleSection>
  );
};
