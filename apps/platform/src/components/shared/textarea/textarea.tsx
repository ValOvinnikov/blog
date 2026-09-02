import type { AriaAttributes, ChangeEvent } from 'react';

import { textareaVariants, type TTextareaVariants } from './textarea-variants';

export type TTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  id?: string;
  placeholder?: string;
  rows?: number;
  maxLength?: number;
  isRequired?: boolean;
  isDisabled?: TTextareaVariants['isDisabled'];
  isReadOnly?: TTextareaVariants['isReadOnly'];
  'aria-describedby'?: AriaAttributes['aria-describedby'];
  className?: string;
};

export const Textarea = ({
  value,
  onChange,
  ariaLabel,
  id,
  placeholder,
  rows,
  maxLength,
  isRequired,
  isDisabled,
  isReadOnly,
  'aria-describedby': ariaDescribedBy,
  className,
}: TTextareaProps) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <textarea
      id={id}
      placeholder={placeholder}
      rows={rows}
      maxLength={maxLength}
      required={isRequired}
      disabled={Boolean(isDisabled)}
      readOnly={Boolean(isReadOnly)}
      value={value}
      onChange={handleChange}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={textareaVariants({ isDisabled, isReadOnly, class: className })}
    />
  );
};
