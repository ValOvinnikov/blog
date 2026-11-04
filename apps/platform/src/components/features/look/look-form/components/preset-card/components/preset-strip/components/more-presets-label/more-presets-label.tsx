import { ICONS } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const morePresetsLabelVariants = tv({
  slots: {
    pill: [
      'inline-flex h-5 min-w-5 items-center justify-center rounded-admin-10 bg-admin-brand-weak px-1.5',
      'text-admin-11-5 font-semibold text-admin-brand-strong',
    ],
  },
});

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
