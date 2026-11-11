import { BRAND_VARIANT } from '@blog/config';
import { QuoteCard } from '@blog/ui/components/molecules/quote-card';
import { useTranslations } from 'next-intl';

export const LookSampleQuote = () => {
  const t = useTranslations('lookPreview');

  return (
    <QuoteCard tone={BRAND_VARIANT.PRIMARY} role={t('quoteRole')}>
      <QuoteCard.Quote>{t('quoteText')}</QuoteCard.Quote>
      <QuoteCard.Name>{t('quoteName')}</QuoteCard.Name>
    </QuoteCard>
  );
};
