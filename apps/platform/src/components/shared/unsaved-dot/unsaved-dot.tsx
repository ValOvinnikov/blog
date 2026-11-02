import { useTranslations } from 'next-intl';

import { unsavedDotVariants } from './unsaved-dot-variants';

type TUnsavedDotProps =
  | { isDecorative: true; label?: never }
  | { isDecorative?: false; label?: string };

export const UnsavedDot = ({ isDecorative, label }: TUnsavedDotProps) => {
  const t = useTranslations('fieldStatus');

  if (isDecorative) {
    return <span aria-hidden="true" className={unsavedDotVariants()} />;
  }

  return (
    <span
      role="img"
      aria-label={label ?? t('unsaved')}
      className={unsavedDotVariants()}
    />
  );
};
