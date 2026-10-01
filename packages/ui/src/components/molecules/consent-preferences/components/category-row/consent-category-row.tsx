import type { IWithClassName, IWithDataTestId } from '@blog/config';
import { Switch } from '@blog/ui/components/atoms/switch';

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
      <Switch
        isChecked={isChecked}
        isLocked={isLocked}
        onChange={onChange}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
      />
    </div>
  );
};
