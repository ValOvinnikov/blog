'use client';

import type { TPresetOption } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import {
  PRESET_LIST_LAYOUT,
  type TPresetListLayout,
} from '@platform/constants/preset-list';
import { tv } from '@platform/utils/tv/tv';
import { useId, type Ref } from 'react';

import { PresetListOption } from './components/preset-list-option/preset-list-option';
import { useActiveOption } from './use-active-option';

const presetOptionListVariants = tv({
  base: ['group outline-none'],
  variants: {
    layout: {
      [PRESET_LIST_LAYOUT.GRID]: ['grid grid-cols-2 gap-1.5 px-2.5 pb-2.5'],
      [PRESET_LIST_LAYOUT.ROWS]: [
        'min-h-0 flex-1 overflow-y-auto overscroll-contain border-t border-admin-line-2',
        '[scrollbar-color:var(--admin-control-line)_transparent] [scrollbar-width:thin]',
        '[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-admin-bar [&::-webkit-scrollbar-thumb]:bg-admin-control-line',
      ],
    },
  },
});

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
