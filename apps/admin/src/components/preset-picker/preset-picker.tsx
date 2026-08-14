import { PRESET_ID, type TPresetId } from '@blog/config';
import { SegmentedControl } from '@blog/ui/atoms/segmented-control';

const PRESET_OPTIONS = [
  { value: PRESET_ID.CONSOLE, label: 'Console' },
  { value: PRESET_ID.EDITORIAL, label: 'Editorial' },
];

export type TPresetPickerProps = {
  value: TPresetId;
  onChange: (value: TPresetId) => void;
};

/**
 * Choosing a preset re-applies every one of its `PRESET_REGISTRY` defaults —
 * the caller owns that reset, this component only reports the selection.
 */
export function PresetPicker({ value, onChange }: TPresetPickerProps) {
  return (
    <SegmentedControl
      ariaLabel="Preset"
      options={PRESET_OPTIONS}
      value={value}
      onChange={onChange}
    />
  );
}
