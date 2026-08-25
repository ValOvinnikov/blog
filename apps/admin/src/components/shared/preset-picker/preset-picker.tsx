import { PRESET_ID, type TPresetId } from '@blog/config';
import { SegmentedControl } from '@blog/ui/atoms/segmented-control';
import { useTranslations } from 'next-intl';

export type TPresetPickerProps = {
  value: TPresetId;
  onChange: (value: TPresetId) => void;
};

/**
 * Choosing a preset re-applies every one of its `PRESET_REGISTRY` defaults —
 * the caller owns that reset, this component only reports the selection.
 */
export const PresetPicker = ({ value, onChange }: TPresetPickerProps) => {
  const t = useTranslations('presetPicker');

  const presetOptions = [
    { value: PRESET_ID.CONSOLE, label: t('console') },
    { value: PRESET_ID.EDITORIAL, label: t('editorial') },
  ];

  return (
    <SegmentedControl
      ariaLabel={t('ariaLabel')}
      options={presetOptions}
      value={value}
      onChange={onChange}
    />
  );
};
