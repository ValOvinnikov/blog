import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { KeyboardEvent } from 'react';

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
    };

const s = segmentedControlVariants();

/**
 * SegmentedControl — a fully controlled switch between a small, mutually
 * exclusive set of views (e.g. a reader's chosen depth for an article). The
 * root is a `div[role="radiogroup"]`, not a labelable element, so it must
 * never be paired with `<label htmlFor>` — the accessible name comes
 * entirely from the required `ariaLabel` prop.
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
}: TSegmentedControlProps<TValue>) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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
