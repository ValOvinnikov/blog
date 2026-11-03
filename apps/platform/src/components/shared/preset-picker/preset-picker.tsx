'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import {
  FONT_CHOICE,
  ICONS,
  PRESET_ID,
  type TNamedControlAria,
  type TPresetId,
} from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import {
  PRESET_PICKER_LAYOUT,
  type TPresetPickerLayout,
} from '@platform/constants/preset-picker';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { PresetMini } from './components/preset-mini';
import { presetPickerVariants } from './preset-picker-variants';

export type TPresetPickerProps = {
  value: TPresetId;
  onChange: (value: TPresetId) => void;
  aria: TNamedControlAria;
  isDisabled?: boolean;
  layout?: TPresetPickerLayout;
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
export const PresetPicker = ({
  value,
  onChange,
  aria,
  isDisabled,
  layout = PRESET_PICKER_LAYOUT.RESPONSIVE,
}: TPresetPickerProps) => {
  const t = useTranslations('presetPicker');
  const idBase = useId();

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
      aria-label={aria.label}
      aria-labelledby={aria.labelledBy}
      aria-describedby={aria.describedBy}
      value={value}
      onValueChange={(next) => onChange(next as TPresetId)}
      disabled={isDisabled}
      className={presetPickerVariants({ layout }).root()}
    >
      {presetOptions.map((preset) => {
        const selected = preset.value === value;
        const { card, footer, footerText, name, description, dot } =
          presetPickerVariants({ selected });
        const nameId = `${idBase}-${preset.value}-name`;
        const descriptionId = `${idBase}-${preset.value}-description`;

        return (
          <Radio.Root
            key={preset.value}
            value={preset.value}
            aria-labelledby={nameId}
            aria-describedby={descriptionId}
            className={card()}
          >
            <PresetMini
              preset={preset.value}
              title={preset.miniPrimary}
              tagline={preset.miniSecondary}
              titleFontFamily={preset.miniPrimaryFontFamily}
            />
            <span className={footer()}>
              <span className={footerText()}>
                <span id={nameId} className={name()}>
                  {preset.label}
                </span>
                <span id={descriptionId} className={description()}>
                  {preset.description}
                </span>
              </span>
              <span className={dot()} aria-hidden="true">
                {selected && (
                  <Icon
                    name={ICONS.TICK}
                    size={ICON_SIZE.XXS}
                    strokeWidth={ICON_STROKE_WIDTH.RADIO_TICK}
                  />
                )}
              </span>
            </span>
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
};
