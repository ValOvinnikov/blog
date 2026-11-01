import { StatusBadge } from '@platform/components/shared/status-badge';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import { fieldStatusTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

import { fieldStatusVariants } from './field-status-variants';

export type TFieldStatusProps = {
  isCustomised: boolean;
  isUnsaved: boolean;
};

export const FieldStatus = ({ isCustomised, isUnsaved }: TFieldStatusProps) => {
  const t = useTranslations('fieldStatus');
  const { root } = fieldStatusVariants();
  const status = isCustomised ? 'customised' : 'default';

  return (
    <span className={root()}>
      {isUnsaved && <UnsavedDot />}
      <StatusBadge tone={fieldStatusTone(status)} hasDot={false}>
        {t(status)}
      </StatusBadge>
    </span>
  );
};
