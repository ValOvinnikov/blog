'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { FONT_CHOICE, PRESET_ID, type TPresetId } from '@blog/config';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { useTranslations } from 'next-intl';

import { presetPickerVariants } from './preset-picker-variants';

export type TPresetPickerProps = {
  value: TPresetId;
  onChange: (value: TPresetId) => void;
};

type TPresetOption = {
  value: TPresetId;
  label: string;
  description: string;
  miniPrimary: string;
  miniSecondary: string;
  miniPrimaryFontFamily: string;
};

/**
 * Choosing a preset re-applies every one of its `PRESET_REGISTRY` defaults —
 * the caller owns that reset, this component only reports the selection. The
 * mini preview inside each card is illustrative only, not a live render of
 * the preset's actual tokens.
 */
export const PresetPicker = ({ value, onChange }: TPresetPickerProps) => {
  const t = useTranslations('presetPicker');

  const presetOptions: TPresetOption[] = [
    {
      value: PRESET_ID.CONSOLE,
      label: t('console'),
      description: t('consoleDescription'),
      miniPrimary: t('consoleMiniPrimary'),
      miniSecondary: t('consoleMiniSecondary'),
      miniPrimaryFontFamily:
        FONT_OPTIONS[FONT_CHOICE.JETBRAINS_MONO].fontFamily,
    },
    {
      value: PRESET_ID.EDITORIAL,
      label: t('editorial'),
      description: t('editorialDescription'),
      miniPrimary: t('editorialMiniPrimary'),
      miniSecondary: t('editorialMiniSecondary'),
      miniPrimaryFontFamily: FONT_OPTIONS[FONT_CHOICE.FRAUNCES].fontFamily,
    },
  ];

  return (
    <RadioGroup
      aria-label={t('ariaLabel')}
      value={value}
      onValueChange={(next) => onChange(next as TPresetId)}
      className={presetPickerVariants().root()}
    >
      {presetOptions.map((preset) => {
        const selected = preset.value === value;
        const {
          card,
          checkmark,
          name,
          description,
          mini,
          miniPrimary,
          miniSecondary,
        } = presetPickerVariants({ selected, preset: preset.value });

        return (
          <Radio.Root
            key={preset.value}
            value={preset.value}
            aria-label={preset.label}
            className={card()}
          >
            <span className={checkmark()} aria-hidden="true">
              ✓
            </span>
            <span className={name()}>{preset.label}</span>
            <span className={description()}>{preset.description}</span>
            <span className={mini()} aria-hidden="true">
              <span
                className={miniPrimary()}
                style={{ fontFamily: preset.miniPrimaryFontFamily }}
              >
                {preset.miniPrimary}
              </span>
              <span className={miniSecondary()}>{preset.miniSecondary}</span>
            </span>
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
};
