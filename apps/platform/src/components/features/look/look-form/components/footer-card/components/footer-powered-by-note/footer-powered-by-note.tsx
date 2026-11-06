import { isUndefined } from '@blog/utils/primitives';
import { textVariants } from '@platform/components/shared/text/text-variants';
import { usePoweredByProductName } from '@platform/context/powered-by-mark-provider';
import { useTranslations } from 'next-intl';

export const FooterPoweredByNote = () => {
  const productName = usePoweredByProductName();
  const t = useTranslations('lookForm');

  if (isUndefined(productName)) return null;

  return (
    <p className={textVariants({ variant: 'hint' })}>
      {t('footerPoweredByNote', { productName })}
    </p>
  );
};
