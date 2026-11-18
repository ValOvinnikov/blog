import { Radio } from '@base-ui/react/radio';
import {
  OptionBody,
  optionBodyIds,
} from '@platform/components/shared/segmented-control/components/option-body/option-body';
import { TileCheck } from '@platform/components/shared/segmented-control/components/tile-check/tile-check';
import { segmentedRadioGroupVariants } from '@platform/components/shared/segmented-control/segmented-radio-group-variants';
import {
  SEGMENTED_RADIO_LAYOUT,
  type TSegmentedRadioLayout,
} from '@platform/constants/segmented-control';
import type { TControlLock } from '@shinefold/config';
import type { ReactNode, Ref } from 'react';

export type TSegmentedRadioOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
  glyph?: ReactNode;
  isWide?: boolean;
};

type TSegmentedRadioOptionProps<TValue extends string> = {
  option: TSegmentedRadioOption<TValue>;
  idPrefix: string;
  layout: TSegmentedRadioLayout;
  isSelected: boolean;
  lock: TControlLock;
  ref: Ref<HTMLButtonElement>;
};

export const SegmentedRadioOption = <TValue extends string>({
  option: { value, label, description, glyph, isWide },
  idPrefix,
  layout,
  isSelected,
  lock: { isLocked = false, isDisabled = false },
  ref,
}: TSegmentedRadioOptionProps<TValue>) => {
  const isTiles = layout === SEGMENTED_RADIO_LAYOUT.TILES;
  const ids = optionBodyIds(idPrefix, value);
  const hasInlineDescription = Boolean(description) && !isTiles;
  const isInactive = isLocked || isDisabled;
  const slots = segmentedRadioGroupVariants({
    layout,
    isInactive,
    isLocked,
    isWide,
    isSelected,
  });

  return (
    <Radio.Root
      ref={ref}
      value={value}
      nativeButton={true}
      render={<button type="button" />}
      aria-labelledby={ids.labelId}
      aria-describedby={hasInlineDescription ? ids.descriptionId : undefined}
      aria-disabled={isInactive || undefined}
      className={slots.option()}
    >
      <OptionBody
        ids={ids}
        label={label}
        description={hasInlineDescription ? description : undefined}
        glyph={glyph}
        classNames={{
          label: slots.optionLabel(),
          description: slots.optionDescription(),
          glyph: slots.glyph(),
        }}
      />
      {isTiles && <TileCheck className={slots.check()} />}
    </Radio.Root>
  );
};
