import { ICONS, SIZE } from '@blog/config';
import { PresetSwatch } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/components/preset-swatch/preset-swatch';
import type { TPresetOption } from '@platform/components/features/look/look-form/components/preset-card/components/preset-strip/preset-option';
import { Icon } from '@platform/components/shared/icon';
import { ICON_SIZE, ICON_STROKE_WIDTH } from '@platform/constants/icon';
import { type TPresetListLayout } from '@platform/constants/preset-list';

import { presetListOptionVariants } from './preset-list-option-variants';

type TPresetListOptionProps<TId extends string> = {
  preset: TPresetOption<TId>;
  id: string;
  layout: TPresetListLayout;
  isSelected: boolean;
  isHighlighted: boolean;
  onChoose: () => void;
  onHighlight: () => void;
};

export const PresetListOption = <TId extends string>({
  preset,
  id,
  layout,
  isSelected,
  isHighlighted,
  onChoose,
  onHighlight,
}: TPresetListOptionProps<TId>) => {
  const { name, description, swatch } = preset;
  const nameId = `${id}-name`;
  const descriptionId = `${id}-description`;
  const {
    option,
    text,
    name: nameSlot,
    description: descriptionSlot,
    tick,
  } = presetListOptionVariants({ layout, selected: isSelected });

  return (
    <div
      id={id}
      role="option"
      aria-selected={isSelected}
      aria-labelledby={nameId}
      aria-describedby={descriptionId}
      data-highlighted={isHighlighted ? '' : undefined}
      onClick={onChoose}
      onPointerMove={onHighlight}
      className={option()}
    >
      <PresetSwatch swatch={swatch} size={SIZE.LG} />
      <span className={text()}>
        <span id={nameId} className={nameSlot()}>
          {name}
        </span>
        <span id={descriptionId} className={descriptionSlot()}>
          {description}
        </span>
      </span>
      {isSelected && (
        <Icon
          name={ICONS.TICK}
          size={ICON_SIZE.MD}
          strokeWidth={ICON_STROKE_WIDTH.CHIP_TICK}
          className={tick()}
        />
      )}
    </div>
  );
};
