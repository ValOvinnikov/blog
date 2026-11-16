import { SamplePart } from '@platform/components/features/site-preview/sample-part';
import { SAMPLE_PART } from '@platform/constants/sample-part';
import { BRAND_VARIANT } from '@shinefold/config';
import { QuoteCard } from '@shinefold/ui/components/molecules/quote-card';
import { useTranslations } from 'next-intl';

export const LookSampleQuote = () => {
  const t = useTranslations('lookPreview');

  return (
    <SamplePart part={SAMPLE_PART.QUOTE_CARD}>
      <QuoteCard tone={BRAND_VARIANT.PRIMARY} role={t('quoteRole')}>
        <QuoteCard.Quote>{t('quoteText')}</QuoteCard.Quote>
        <QuoteCard.Name>{t('quoteName')}</QuoteCard.Name>
      </QuoteCard>
    </SamplePart>
  );
};
