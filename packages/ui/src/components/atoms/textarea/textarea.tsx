import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { type AriaAttributes, type ChangeEvent } from 'react';

import { textareaVariants, type TTextareaVariants } from './textarea-variants';

export type TTextareaProps = IWithClassName &
  IWithDataTestId & {
    value: string;
    onChange: (value: string) => void;
    ariaLabel: string;
    isInvalid?: TTextareaVariants['invalid'];
    id?: string;
    placeholder?: string;
    rows?: number;
    isRequired?: boolean;
    isDisabled?: boolean;
    'aria-describedby'?: AriaAttributes['aria-describedby'];
  };

/** A pure, controlled multi-line field that resizes vertically only. */
export const Textarea = ({
  value,
  onChange,
  ariaLabel,
  isInvalid = false,
  className,
  dataTestId,
  id,
  placeholder,
  rows,
  isRequired,
  isDisabled,
  'aria-describedby': ariaDescribedby,
}: TTextareaProps) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <textarea
      id={id}
      placeholder={placeholder}
      rows={rows}
      required={isRequired}
      disabled={isDisabled}
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel}
      aria-invalid={isInvalid}
      aria-describedby={ariaDescribedby}
      data-testid={dataTestId}
      className={textareaVariants({ invalid: isInvalid, class: className })}
    />
  );
};
