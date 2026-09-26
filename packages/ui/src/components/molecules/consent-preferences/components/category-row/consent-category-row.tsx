import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { ChangeEvent } from 'react';

import { consentCategoryRowVariants } from './consent-category-row-variants';

export type TConsentCategoryRowProps = IWithClassName &
  IWithDataTestId & {
    id: string;
    label: string;
    description: string;
    isChecked: boolean;
    isLocked?: boolean;
    onChange: (checked: boolean) => void;
  };

const s = consentCategoryRowVariants();

/** One row of a `ConsentPreferences` dialog: a category's label, description and switch. */
export const ConsentCategoryRow = ({
  id,
  label,
  description,
  isChecked,
  isLocked = false,
  onChange,
  className,
  dataTestId,
}: TConsentCategoryRowProps) => {
  const labelId = `${id}-label`;
  const descriptionId = `${id}-description`;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <div className={s.content()}>
        <span id={labelId} className={s.label()}>
          {label}
        </span>
        <p id={descriptionId} className={s.description()}>
          {description}
        </p>
      </div>
      <label className={s.switchWrapper()}>
        <input
          type="checkbox"
          role="switch"
          aria-labelledby={labelId}
          aria-describedby={descriptionId}
          checked={isChecked}
          disabled={isLocked}
          onChange={handleChange}
          className={s.input()}
        />
        <span className={s.track()} aria-hidden="true" />
        <span className={s.thumb()} aria-hidden="true" />
      </label>
    </div>
  );
};
