import { Accordion } from '@blog/ui/components/organisms/accordion';
import { LookSampleSection } from '@platform/components/features/site-preview/look-sample/components/look-sample-section/look-sample-section';
import { LOOK_SAMPLE_FAQ_ITEM } from '@platform/constants/look-sample';
import { useTranslations } from 'next-intl';

export const LookSampleFaq = () => {
  const t = useTranslations('lookPreview');

  return (
    <LookSampleSection heading={t('faqHeading')}>
      <Accordion defaultValue={[LOOK_SAMPLE_FAQ_ITEM.FIRST]}>
        <Accordion.Item value={LOOK_SAMPLE_FAQ_ITEM.FIRST}>
          <Accordion.Trigger>{t('faqFirstQuestion')}</Accordion.Trigger>
          <Accordion.Panel>{t('faqFirstAnswer')}</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value={LOOK_SAMPLE_FAQ_ITEM.SECOND}>
          <Accordion.Trigger>{t('faqSecondQuestion')}</Accordion.Trigger>
          <Accordion.Panel>{t('faqSecondAnswer')}</Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </LookSampleSection>
  );
};
