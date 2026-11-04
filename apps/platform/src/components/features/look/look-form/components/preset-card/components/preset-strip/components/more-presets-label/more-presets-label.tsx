import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import { useTranslations } from 'next-intl';

import { morePresetsLabelVariants } from './more-presets-label-variants';

type TMorePresetsLabelProps = {
  hiddenCount: number;
};

export const MorePresetsLabel = ({ hiddenCount }: TMorePresetsLabelProps) => {
  const t = useTranslations('presetPicker');
  const { pill } = morePresetsLabelVariants();

  return (
    <>
      <Icon name={ICONS.GRID} size={ICON_SIZE.MD} />
      {t('morePresets')}
      <span className={pill()} aria-hidden="true">
        {hiddenCount}
      </span>
    </>
  );
};
