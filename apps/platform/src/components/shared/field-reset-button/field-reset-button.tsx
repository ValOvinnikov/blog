import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useTranslations } from 'next-intl';

export type TFieldResetButtonProps = {
  onReset: () => void;
};

export const FieldResetButton = ({ onReset }: TFieldResetButtonProps) => {
  const t = useTranslations('fieldStatus');

  return (
    <Button size={SIZE.XS} variant={BUTTON_VARIANT.SECONDARY} onClick={onReset}>
      {t('reset')}
    </Button>
  );
};
