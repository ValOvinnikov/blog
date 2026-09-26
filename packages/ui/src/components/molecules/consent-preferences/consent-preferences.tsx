import { SIZE, type IWithClassName, type IWithDataTestId } from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { Heading } from '@blog/ui/components/atoms/heading';
import type { THeadingLevel } from '@blog/ui/lib/react';

import { ConsentCategoryRow } from './components/category-row/consent-category-row';
import { consentPreferencesVariants } from './consent-preferences-variants';

export interface IConsentCategory {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  locked?: boolean;
}

export type TConsentPreferencesProps = IWithClassName &
  IWithDataTestId & {
    headingLevel: THeadingLevel;
    heading: string;
    categories: IConsentCategory[];
    onCategoryChange: (id: string, checked: boolean) => void;
    saveLabel: string;
    onSave: () => void;
  };

const s = consentPreferencesVariants();

/** The body of the cookie-consent preferences dialog: one switch row per category and a Save action. The caller renders it inside its own `<dialog>` element. */
export const ConsentPreferences = ({
  headingLevel,
  heading,
  categories,
  onCategoryChange,
  saveLabel,
  onSave,
  className,
  dataTestId,
}: TConsentPreferencesProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <Heading level={headingLevel} className={s.heading()}>
      {heading}
    </Heading>
    <div className={s.list()}>
      {categories.map((category) => (
        <ConsentCategoryRow
          key={category.id}
          id={category.id}
          label={category.label}
          description={category.description}
          isChecked={category.checked}
          isLocked={category.locked}
          onChange={(checked) => onCategoryChange(category.id, checked)}
        />
      ))}
    </div>
    <div className={s.actions()}>
      <Button variant="primary" size={SIZE.MD} onClick={onSave}>
        {saveLabel}
      </Button>
    </div>
  </div>
);
