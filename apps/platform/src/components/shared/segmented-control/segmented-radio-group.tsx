'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import type { TMaybeNull, TNamedControlAria } from '@blog/config';
import type { IWithClassName } from '@blog/config/types';
import {
  SEGMENTED_RADIO_LAYOUT,
  type TSegmentedRadioLayout,
} from '@platform/constants/segmented-control';
import { useTrackScroll } from '@platform/utils/use-track-scroll/use-track-scroll';
import { useId, type ReactNode } from 'react';

import {
  OptionBody,
  optionBodyIds,
} from './components/option-body/option-body';
import { SelectedDescription } from './components/selected-description/selected-description';
import { TileCheck } from './components/tile-check/tile-check';
import type { TSegmentedControlLock } from './segmented-control';
import {
  SEGMENTED_FADE_WIDTH_PX,
  segmentedRadioGroupVariants,
} from './segmented-radio-group-variants';
import { useLockedArrowFocus } from './use-locked-arrow-focus';
import { useSelectedDescription } from './use-selected-description';

type TSegmentedRadioOption<TValue extends string> = {
  value: TValue;
  label: string;
  description?: string;
  glyph?: ReactNode;
  isWide?: boolean;
};

type TSegmentedRadioGroupProps<TValue extends string> = IWithClassName & {
  options: TSegmentedRadioOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  aria: TNamedControlAria;
  lock?: TSegmentedControlLock;
  layout?: TSegmentedRadioLayout;
};

export const SegmentedRadioGroup = <TValue extends string>({
  options,
  value,
  onChange,
  aria,
  lock = {},
  layout = SEGMENTED_RADIO_LAYOUT.TRACK,
  className,
}: TSegmentedRadioGroupProps<TValue>) => {
  const idPrefix = useId();
  const { label: ariaLabel, labelledBy, describedBy } = aria;
  const isTiles = layout === SEGMENTED_RADIO_LAYOUT.TILES;
  const isLocked = Boolean(lock.isLocked || lock.isDisabled);
  const selectedIndex = options.findIndex(
    ({ value: optionValue }) => optionValue === value,
  );
  const { trackRef, setItemRef, onScroll, hasMoreStart, hasMoreEnd } =
    useTrackScroll<HTMLDivElement, HTMLButtonElement>({
      selectedIndex,
      fadeWidth: SEGMENTED_FADE_WIDTH_PX,
    });
  const { setOptionRef, onKeyDown } = useLockedArrowFocus(isLocked);
  const { descriptionId, description, groupDescribedBy } =
    useSelectedDescription(options, value, describedBy);
  const { root, track, fade, fadeStart, fadeEnd } = segmentedRadioGroupVariants(
    { layout },
  );

  const setRef = (index: number) => (node: TMaybeNull<HTMLButtonElement>) => {
    setItemRef(index)(node);
    setOptionRef(index)(node);
  };

  return (
    <div className={root({ class: className })}>
      <RadioGroup
        ref={trackRef}
        value={value}
        onValueChange={(nextValue: TValue) => onChange(nextValue)}
        readOnly={isLocked}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={isTiles ? groupDescribedBy : describedBy}
        onScroll={onScroll}
        onKeyDown={onKeyDown}
        className={track()}
      >
        {options.map(
          (
            {
              value: optionValue,
              label,
              description: optionDescription,
              glyph,
              isWide,
            },
            index,
          ) => {
            const ids = optionBodyIds(idPrefix, optionValue);
            const hasInlineDescription = Boolean(optionDescription) && !isTiles;
            const slots = segmentedRadioGroupVariants({
              layout,
              isLocked,
              isWide,
              isSelected: optionValue === value,
            });

            return (
              <Radio.Root
                key={optionValue}
                ref={setRef(index)}
                value={optionValue}
                nativeButton={true}
                render={<button type="button" />}
                aria-labelledby={ids.labelId}
                aria-describedby={
                  hasInlineDescription ? ids.descriptionId : undefined
                }
                aria-disabled={isLocked || undefined}
                className={slots.option()}
              >
                <OptionBody
                  ids={ids}
                  label={label}
                  description={
                    hasInlineDescription ? optionDescription : undefined
                  }
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
          },
        )}
      </RadioGroup>
      {hasMoreStart ? (
        <span aria-hidden="true" className={fade({ class: fadeStart() })} />
      ) : null}
      {hasMoreEnd ? (
        <span aria-hidden="true" className={fade({ class: fadeEnd() })} />
      ) : null}
      {isTiles && (
        <SelectedDescription id={descriptionId} description={description} />
      )}
    </div>
  );
};
