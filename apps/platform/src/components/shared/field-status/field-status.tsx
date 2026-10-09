import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import { fieldStatusTone } from '@platform/utils/status-tone/status-tone';
import { useTranslations } from 'next-intl';

import { fieldStatusVariants } from './field-status-variants';

export type TFieldStatusProps = {
  isCustomised: boolean;
  isUnsaved: boolean;
  onReset?: () => void;
};

export const FieldStatus = ({
  isCustomised,
  isUnsaved,
  onReset,
}: TFieldStatusProps) => {
  const t = useTranslations('fieldStatus');
  const { root } = fieldStatusVariants();
  const status = isCustomised ? 'customised' : 'default';

  return (
    <span className={root()}>
      {isUnsaved && <UnsavedDot />}
      <StatusBadge tone={fieldStatusTone(status)} hasDot={false}>
        {t(status)}
      </StatusBadge>
      {isCustomised && onReset && (
        <Button size={SIZE.SM} variant="secondary" onClick={onReset}>
          {t('reset')}
        </Button>
      )}
    </span>
  );
};
