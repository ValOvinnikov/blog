'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { ICONS, SIZE } from '@blog/config';
import { PresetSwatch } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/preset-swatch/preset-swatch';
import type { TPresetOption } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import { Icon } from '@platform/components/shared/icon';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { DISABLED_AFFORDANCE_CLASSES } from '@platform/utils/disabled-state-classes/disabled-state-classes';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import {
  SELECTED_CHOICE_CLASSES,
  UNSELECTED_CHOICE_CLASSES,
} from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';
import { Fragment, useId } from 'react';

const presetChipsVariants = tv({
  slots: {
    root: ['flex flex-none flex-nowrap gap-3'],
    chip: [
      'flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-admin-control bg-admin-surface pr-3 pl-1.5 lg:h-10',
      'text-admin-13-5 font-semibold whitespace-nowrap text-admin-text',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
      ...DISABLED_AFFORDANCE_CLASSES,
    ],
    tick: ['text-admin-brand-ink'],
    description: ['sr-only'],
  },
  variants: {
    selected: {
      true: {
        chip: SELECTED_CHOICE_CLASSES,
      },
      false: {
        chip: [
          ...UNSELECTED_CHOICE_CLASSES,
          'border-admin-control-line not-data-[disabled]:hover:border-admin-brand-ink',
        ],
      },
    },
  },
});

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
