import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { lookFieldVariants } from './look-field-variants';

export type TLookFieldProps = {
  label: string;
  hint?: string;
  isOptional?: boolean;
  id?: string;
  children: ReactNode;
};

export const LookField = ({
  label,
  hint,
  isOptional = false,
  id,
  children,
}: TLookFieldProps) => {
  const t = useTranslations('lookForm');
  const {
    root,
    label: labelSlot,
    optionalTag,
    hint: hintSlot,
  } = lookFieldVariants();

  return (
    <div id={id} className={root()}>
      <span className={labelSlot()}>
        {label}
        {isOptional && (
          <span className={optionalTag()}>{t('optionalTag')}</span>
        )}
      </span>
      {hint && <p className={hintSlot()}>{hint}</p>}
      {children}
    </div>
  );
};
