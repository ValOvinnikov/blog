import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { AriaAttributes, ChangeEvent } from 'react';

import { switchVariants } from './switch-variants';

export type TSwitchProps = IWithClassName &
  IWithDataTestId & {
    isChecked: boolean;
    isLocked?: boolean;
    onChange: (checked: boolean) => void;
    'aria-labelledby'?: AriaAttributes['aria-labelledby'];
    'aria-describedby'?: AriaAttributes['aria-describedby'];
  };

const s = switchVariants();

/** A labelled on/off control for a single setting, backed by a native checkbox. */
export const Switch = ({
  isChecked,
  isLocked = false,
  onChange,
  className,
  dataTestId,
  'aria-labelledby': ariaLabelledby,
  'aria-describedby': ariaDescribedby,
}: TSwitchProps) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <label className={s.wrapper({ class: className })}>
      <input
        type="checkbox"
        role="switch"
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        checked={isChecked}
        disabled={isLocked}
        onChange={handleChange}
        data-testid={dataTestId}
        className={s.input()}
      />
      <span className={s.track()} aria-hidden="true" />
      <span className={s.thumb()} aria-hidden="true" />
    </label>
  );
};
