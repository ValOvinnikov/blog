import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { AriaAttributes, KeyboardEvent } from 'react';

import { segmentedControlVariants } from './segmented-control-variants';

const NEXT_OPTION_KEYS = new Set(['ArrowRight', 'ArrowDown']);
const PREVIOUS_OPTION_KEYS = new Set(['ArrowLeft', 'ArrowUp']);

export interface ISegmentedControlOption<TValue extends string = string> {
  value: TValue;
  label: string;
}

export type TSegmentedControlProps<TValue extends string = string> =
  IWithClassName &
    IWithDataTestId & {
      options: ISegmentedControlOption<TValue>[];
      value: TValue;
      onChange: (value: TValue) => void;
      ariaLabel: string;
      isDisabled?: boolean;
      'aria-describedby'?: AriaAttributes['aria-describedby'];
    };

const s = segmentedControlVariants();

/**
 * SegmentedControl — a fully controlled switch between a small, mutually
 * exclusive set of views (e.g. a reader's chosen depth for an article). The
 * selected value, its options, and the change handler all live in the
 * caller; this component holds no state of its own. Uses the radiogroup
 * pattern — one exclusive choice among peers — rather than tabs, since the
 * component itself shows or hides no panel. Arrow keys move both focus and
 * the selection between options, wrapping at the ends, matching the ARIA
 * authoring practices for a radiogroup. `isDisabled` renders every option as
 * a genuine disabled radio (still exposed by role, just unavailable) rather
 * than falling back to static text — pair it with `aria-describedby`
 * pointing at an explanatory element when the caller has a reason to give.
 *
 * @example
 * <SegmentedControl
 *   ariaLabel="Reading depth"
 *   options={[
 *     { value: DEPTH.SKIM, label: '30s' },
 *     { value: DEPTH.READ, label: 'Read' },
 *     { value: DEPTH.DEEP, label: 'Deep' },
 *   ]}
 *   value={depth}
 *   onChange={setDepth}
 * />
 */
export const SegmentedControl = <TValue extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
  dataTestId,
  isDisabled = false,
  'aria-describedby': ariaDescribedby,
}: TSegmentedControlProps<TValue>) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled) return;

    const isNext = NEXT_OPTION_KEYS.has(event.key);
    const isPrevious = PREVIOUS_OPTION_KEYS.has(event.key);
    if (!isNext && !isPrevious) return;

    const currentIndex = options.findIndex((option) => option.value === value);
    if (currentIndex === -1) return;

    event.preventDefault();
    const delta = isNext ? 1 : -1;
    const nextIndex = (currentIndex + delta + options.length) % options.length;
    const nextOption = options[nextIndex];
    if (!nextOption) return;

    onChange(nextOption.value);

    const radios =
      event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    radios[nextIndex]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-disabled={isDisabled}
      aria-describedby={ariaDescribedby}
      onKeyDown={handleKeyDown}
      className={s.root({ class: className })}
      data-testid={dataTestId}
    >
      {options.map((option) => {
        const selected = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            disabled={isDisabled}
            onClick={() => onChange(option.value)}
            className={s.option({ selected })}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
