'use client';

import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import type { TNamedControlAria } from '@blog/config';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';
import { useId } from 'react';

import { useTrackScroll } from './use-track-scroll';

const segmentedRadioGroupVariants = tv({
  slots: {
    root: ['relative flex w-full md:w-auto md:flex-none md:self-start'],
    track: [
      'relative flex w-full gap-[2px] rounded-admin bg-admin-theme-track p-[3px]',
      'max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden',
      'md:inline-flex md:w-auto',
    ],
    option: [
      'flex min-h-11 min-w-[120px] shrink-0 cursor-pointer flex-col items-start justify-center',
      'rounded-admin-control px-3 py-[6px] text-left text-admin-text md:min-h-0',
      'data-[checked]:bg-admin-surface data-[checked]:not-focus-visible:shadow-admin-xs',
      focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
    ],
    optionLabel: [
      'block text-admin-13 leading-[18px] font-semibold md:leading-4',
    ],
    optionDescription: [
      'block text-admin-12 leading-4 font-normal text-admin-muted md:leading-[15px]',
    ],
    fade: [
      'pointer-events-none absolute inset-y-0 w-7 from-admin-theme-track to-admin-theme-track/0 md:hidden',
    ],
    fadeStart: ['left-0 rounded-l-admin bg-linear-to-r'],
    fadeEnd: ['right-0 rounded-r-admin bg-linear-to-l'],
  },
  variants: {
    isWide: {
      true: { option: ['min-w-[150px]'] },
    },
  },
});

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
  const { trackRef, setOptionRef, onScroll, hasMoreStart, hasMoreEnd } =
    useTrackScroll(selectedIndex);
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
            const labelId = `${idPrefix}-${optionValue}-label`;
            const descriptionId = `${idPrefix}-${optionValue}-description`;

            return (
              <Radio.Root
                key={optionValue}
                ref={setOptionRef(index)}
                value={optionValue}
                nativeButton={true}
                render={<button type="button" />}
                aria-labelledby={labelId}
                aria-describedby={descriptionId}
                className={option({ isWide })}
              >
                <span id={labelId} className={optionLabel()}>
                  {label}
                </span>
                <span id={descriptionId} className={optionDescription()}>
                  {description}
                </span>
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
