'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { ICONS, SIZE } from '@blog/config';
import { PresetSwatch } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/preset-swatch/preset-swatch';
import type { TPresetOption } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { Fragment, useId } from 'react';

import { presetChipsVariants } from './preset-chips-variants';

type TPresetChipsProps<TId extends string> = {
  presets: TPresetOption<TId>[];
  value: TId;
  onChange: (value: TId) => void;
  labelledBy: string;
  describedBy?: string;
  isDisabled?: boolean;
};

export const PresetChips = <TId extends string>({
  presets,
  value,
  onChange,
  labelledBy,
  describedBy,
  isDisabled,
}: TPresetChipsProps<TId>) => {
  const idBase = useId();
  const { root } = presetChipsVariants();

  return (
    <RadioGroup
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      value={value}
      onValueChange={(next) => onChange(next as TId)}
      disabled={isDisabled}
      className={root()}
    >
      {presets.map(({ id, name, description: text, swatch }) => {
        const selected = id === value;
        const { chip, tick, description } = presetChipsVariants({ selected });
        const descriptionId = `${idBase}-${id}-description`;

        return (
          <Fragment key={id}>
            <Radio.Root
              value={id}
              aria-describedby={descriptionId}
              className={chip()}
            >
              <PresetSwatch swatch={swatch} size={SIZE.SM} />
              {name}
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
              {text}
            </span>
          </Fragment>
        );
      })}
    </RadioGroup>
  );
};
