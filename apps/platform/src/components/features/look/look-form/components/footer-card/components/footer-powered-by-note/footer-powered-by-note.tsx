import { textVariants } from '@platform/components/shared/text/text-variants';
import { useHasPoweredByMark } from '@platform/context/powered-by-mark-provider';
import { SHINEFOLD_LOGO_NAME } from '@shinefold/utils/shinefold-logo';
import { useTranslations } from 'next-intl';

export const FooterPoweredByNote = () => {
  const hasPoweredByMark = useHasPoweredByMark();
  const t = useTranslations('lookForm');

  if (!hasPoweredByMark) return null;

  return (
    <p className={textVariants({ variant: 'hint' })}>
      {t('footerPoweredByNote', { productName: SHINEFOLD_LOGO_NAME })}
    </p>
  );
};
