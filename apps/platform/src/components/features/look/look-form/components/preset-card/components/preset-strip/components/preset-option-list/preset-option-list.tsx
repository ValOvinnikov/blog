'use client';

import type { TPresetOption } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import {
  PRESET_LIST_LAYOUT,
  type TPresetListLayout,
} from '@platform/constants/preset-list';
import { useId, type Ref } from 'react';

import { PresetListOption } from './components/preset-list-option/preset-list-option';
import { presetOptionListVariants } from './preset-option-list-variants';
import { useActiveOption } from './use-active-option';

const COLUMNS = {
  [PRESET_LIST_LAYOUT.GRID]: 2,
  [PRESET_LIST_LAYOUT.ROWS]: 1,
} as const satisfies Record<TPresetListLayout, number>;

type TPresetOptionListProps<TId extends string> = {
  presets: TPresetOption<TId>[];
  value: TId;
  onChoose: (value: TId) => void;
  labelledBy: string;
  layout: TPresetListLayout;
  ref?: Ref<HTMLDivElement>;
};

export const PresetOptionList = <TId extends string>({
  presets,
  value,
  onChoose,
  labelledBy,
  layout,
  ref,
}: TPresetOptionListProps<TId>) => {
  const idBase = useId();
  const optionId = (index: number) => `${idBase}-${index}`;
  const { activeIndex, setActiveIndex, onKeyDown } = useActiveOption({
    count: presets.length,
    columns: COLUMNS[layout],
    initialIndex: Math.max(
      presets.findIndex(({ id }) => id === value),
      0,
    ),
    onChoose: (index) => {
      const preset = presets[index];
      if (preset) {
        onChoose(preset.id);
      }
    },
  });

  return (
    <div
      ref={ref}
      role="listbox"
      tabIndex={0}
      aria-labelledby={labelledBy}
      aria-activedescendant={optionId(activeIndex)}
      onKeyDown={onKeyDown}
      className={presetOptionListVariants({ layout })}
    >
      {presets.map((preset, index) => (
        <PresetListOption
          key={preset.id}
          preset={preset}
          id={optionId(index)}
          layout={layout}
          isSelected={preset.id === value}
          isHighlighted={index === activeIndex}
          onChoose={() => onChoose(preset.id)}
          onHighlight={() => setActiveIndex(index)}
        />
      ))}
    </div>
  );
};
