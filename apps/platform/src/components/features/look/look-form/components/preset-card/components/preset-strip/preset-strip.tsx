'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { ICONS, PRESET_ID, type TPresetId } from '@blog/config';
import { Icon } from '@platform/components/shared/icon';
import { PRESET_LABEL_KEY } from '@platform/components/shared/preset-picker';
import { FONT_OPTIONS } from '@platform/config/fonts';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { useTranslations } from 'next-intl';
import { Fragment, useId } from 'react';

import { presetStripVariants } from './preset-strip-variants';
import { PRESET_SWATCH } from './preset-swatch';

export type TPresetStripProps = {
  value: TPresetId;
  onChange: (value: TPresetId) => void;
  labelledBy: string;
  describedBy?: string;
  isDisabled?: boolean;
};

const PRESETS = Object.values(PRESET_ID);

export const PresetStrip = ({
  value,
  onChange,
  labelledBy,
  describedBy,
  isDisabled,
}: TPresetStripProps) => {
  const t = useTranslations('presetPicker');
  const idBase = useId();

  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      value={value}
      onValueChange={(next) => onChange(next as TPresetId)}
      disabled={isDisabled}
      className={presetStripVariants().root()}
    >
      {PRESETS.map((preset) => {
        const selected = preset === value;
        const labelKey = PRESET_LABEL_KEY[preset];
        const { glyph, font } = PRESET_SWATCH[preset];
        const { chip, swatch, tick, description } = presetStripVariants({
          preset,
          selected,
        });
        const descriptionId = `${idBase}-${preset}-description`;

        return (
          <Fragment key={preset}>
            <Radio.Root
              value={preset}
              aria-describedby={descriptionId}
              className={chip()}
            >
              <span
                className={swatch()}
                style={{ fontFamily: FONT_OPTIONS[font].fontFamily }}
                aria-hidden="true"
              >
                {glyph}
              </span>
              {t(labelKey)}
              {selected && (
                <Icon
                  name={ICONS.TICK}
                  size={ICON_SIZE.MD}
                  strokeWidth={ICON_STROKE_WIDTH.CHIP_TICK}
                  className={tick()}
                />
              )}
            </Radio.Root>
            <span id={descriptionId} className={description()}>
              {t(`${labelKey}Description`)}
            </span>
          </Fragment>
        );
      })}
    </RadioGroup>
  );
};
