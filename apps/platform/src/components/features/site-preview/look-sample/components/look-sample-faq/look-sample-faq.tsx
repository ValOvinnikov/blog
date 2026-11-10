import { Heading } from '@blog/ui/components/atoms/heading';
import { Accordion } from '@blog/ui/components/organisms/accordion';
import { LOOK_SAMPLE_FAQ_ITEM } from '@platform/constants/look-sample';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { lookSampleFaqVariants } from './look-sample-faq-variants';

export const LookSampleFaq = () => {
  const t = useTranslations('lookPreview');
  const headingId = useId();
  const { root, heading } = lookSampleFaqVariants();

  return (
    <section aria-labelledby={headingId} className={root()}>
      <Heading level={2} visual="preview" id={headingId} className={heading()}>
        {t('faqHeading')}
      </Heading>
      <Accordion defaultValue={[LOOK_SAMPLE_FAQ_ITEM.FIRST]}>
        <Accordion.Item value={LOOK_SAMPLE_FAQ_ITEM.FIRST}>
          <Accordion.Trigger>{t('faqFirstQuestion')}</Accordion.Trigger>
          <Accordion.Panel>{t('faqFirstAnswer')}</Accordion.Panel>
        </Accordion.Item>
        <Accordion.Item value={LOOK_SAMPLE_FAQ_ITEM.SECOND}>
          <Accordion.Trigger>{t('faqSecondQuestion')}</Accordion.Trigger>
        </Accordion.Item>
      </Accordion>
    </section>
  );
};
