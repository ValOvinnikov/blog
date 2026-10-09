import { useTranslations } from 'next-intl';

import { unsavedDotVariants } from './unsaved-dot-variants';

export const UnsavedDot = () => {
  const t = useTranslations('fieldStatus');
  const { dot, label } = unsavedDotVariants();

  return (
    <span>
      <span aria-hidden="true" className={dot()} />
      <span className={label()}>{t('unsaved')}</span>
    </span>
  );
};
