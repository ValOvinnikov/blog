'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import type { TNamedControlAria } from '@blog/config';
import { useTrackScroll } from '@platform/utils/use-track-scroll/use-track-scroll';
import { useId } from 'react';

import {
  OptionBody,
  optionBodyIds,
} from './components/option-body/option-body';
import {
  SEGMENTED_FADE_WIDTH_PX,
  segmentedRadioGroupVariants,
} from './segmented-radio-group-variants';

type TSegmentedRadioOption<TValue extends string> = {
  value: TValue;
  label: string;
  description: string;
  isWide?: boolean;
};

type TSegmentedRadioGroupProps<TValue extends string> = {
  options: TSegmentedRadioOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  aria: TNamedControlAria;
  className?: string;
};

export const SegmentedRadioGroup = <TValue extends string>({
  options,
  value,
  onChange,
  aria,
  className,
}: TSegmentedRadioGroupProps<TValue>) => {
  const idPrefix = useId();
  const { label: ariaLabel, labelledBy, describedBy } = aria;
  const selectedIndex = options.findIndex(
    ({ value: optionValue }) => optionValue === value,
  );
  const { trackRef, setItemRef, onScroll, hasMoreStart, hasMoreEnd } =
    useTrackScroll<HTMLDivElement, HTMLButtonElement>({
      selectedIndex,
      fadeWidth: SEGMENTED_FADE_WIDTH_PX,
    });
  const {
    root,
    track,
    option,
    optionLabel,
    optionDescription,
    fade,
    fadeStart,
    fadeEnd,
  } = segmentedRadioGroupVariants();

  return (
    <div className={root({ class: className })}>
      <RadioGroup
        ref={trackRef}
        value={value}
        onValueChange={(nextValue: TValue) => onChange(nextValue)}
        aria-label={ariaLabel}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onScroll={onScroll}
        className={track()}
      >
        {options.map(
          ({ value: optionValue, label, description, isWide }, index) => {
            const ids = optionBodyIds(idPrefix, optionValue);

            return (
              <Radio.Root
                key={optionValue}
                ref={setItemRef(index)}
                value={optionValue}
                nativeButton={true}
                render={<button type="button" />}
                aria-labelledby={ids.labelId}
                aria-describedby={ids.descriptionId}
                className={option({ isWide })}
              >
                <OptionBody
                  ids={ids}
                  label={label}
                  description={description}
                  labelClassName={optionLabel()}
                  descriptionClassName={optionDescription()}
                />
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
    </div>
  );
};
