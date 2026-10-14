import { SIZE, type IWithClassName, type IWithDataTestId } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';

import { ConsentCategoryRow } from './components/category-row/consent-category-row';
import { consentPreferencesVariants } from './consent-preferences-variants';

export interface IConsentCategory {
  id: string;
  label: string;
  description: string;
  isLocked?: boolean;
}

export type TConsentPreferencesProps = IWithClassName &
  IWithDataTestId & {
    categories: IConsentCategory[];
    values: Record<string, boolean>;
    onCategoryChange: (id: string, checked: boolean) => void;
    saveLabel: string;
    onSave: () => void;
  } & (
    | { closeLabel?: never; onClose?: never }
    | { closeLabel: string; onClose: () => void }
  );

const s = consentPreferencesVariants();

/** The body of the cookie-consent preferences dialog; the caller's dialog supplies the heading. */
export const ConsentPreferences = ({
  categories,
  values,
  onCategoryChange,
  saveLabel,
  onSave,
  closeLabel,
  onClose,
  className,
  dataTestId,
}: TConsentPreferencesProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <div className={s.list()}>
      {categories.map((category) => (
        <ConsentCategoryRow
          key={category.id}
          label={category.label}
          description={category.description}
          isChecked={category.isLocked ? true : (values[category.id] ?? false)}
          isLocked={category.isLocked}
          onChange={(checked) => onCategoryChange(category.id, checked)}
        />
      ))}
    </div>
    <div className={s.actions()}>
      {onClose && (
        <Button variant="ghost" size={SIZE.MD} onClick={onClose}>
          {closeLabel}
        </Button>
      )}
      <Button variant="primary" size={SIZE.MD} onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  </div>
);
