import { ICONS, SIZE } from '@blog/config';
import { PresetSwatch } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/preset-swatch/preset-swatch';
import type { TPresetOption } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE } from '@platform/constants/icon';
import { tv } from '@platform/utils/tv/tv';
import { useTranslations } from 'next-intl';

const presetSheetSummaryVariants = tv({
  slots: {
    text: ['flex min-w-0 flex-1 flex-col'],
    name: ['text-admin-14 font-semibold text-admin-text'],
    description: ['truncate text-admin-12-5 text-admin-muted'],
    meta: ['shrink-0 text-admin-12-5 text-admin-muted'],
  },
});

type TPresetSheetSummaryProps<TId extends string> = {
  preset: TPresetOption<TId>;
  total: number;
  nameId: string;
};

export const PresetSheetSummary = <TId extends string>({
  preset,
  total,
  nameId,
}: TPresetSheetSummaryProps<TId>) => {
  const t = useTranslations('presetPicker');
  const { name, description, swatch } = preset;
  const {
    text,
    name: nameSlot,
    description: descriptionSlot,
    meta,
  } = presetSheetSummaryVariants();

  return (
    <>
      <PresetSwatch swatch={swatch} size={SIZE.MD} />
      <span className={text()}>
        <span id={nameId} className={nameSlot()}>
          {name}
        </span>
        <span className={descriptionSlot()}>{description}</span>
      </span>
      <span className={meta()}>{t('presetCount', { count: total })}</span>
      <Icon name={ICONS.CHEVRON_DOWN} size={ICON_SIZE.XL} className={meta()} />
    </>
  );
};
