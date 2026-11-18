import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import type { TLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { FieldLabel } from '@platform/components/shared/field-label';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { isBrandAssetKind } from '@platform/utils/look-form-values/look-form-values';
import type { IWithChildren } from '@shinefold/config/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { LookFieldBadge } from './components/look-field-badge/look-field-badge';
import { lookFieldVariants } from './look-field-variants';

export type TLookFieldProps = IWithChildren & {
  field: keyof TLookFormValues;
  label: string;
  hint?: string;
  error?: string;
  isGroup?: boolean;
  lock?: TLookFieldLock;
};

export const LookField = ({
  field,
  label,
  hint,
  error,
  isGroup = false,
  lock,
  children,
}: TLookFieldProps) => {
  const { hasFieldChanged } = useLookForm();
  const { labelId, growthBadgeId, isDisabled = false } = lock ?? {};
  const t = useTranslations('lookForm');
  const hintId = useId();
  const {
    field: fieldSlot,
    labelRow,
    label: labelSlot,
    optional,
    hint: hintSlot,
    error: errorSlot,
  } = lookFieldVariants();

  const labelContent = (
    <>
      {label}
      {isBrandAssetKind(field) && (
        <>
          {' '}
          <span className={optional()}>{t('optionalTag')}</span>
        </>
      )}
      {hasFieldChanged(field) && (
        <>
          {' '}
          <UnsavedDot label={t('fieldUnsavedLabel')} />
        </>
      )}
    </>
  );
  const badge = (
    <LookFieldBadge field={field} label={label} growthBadgeId={growthBadgeId} />
  );
  const description = hint && (
    <Field.Description id={hintId} className={hintSlot()}>
      {hint}
    </Field.Description>
  );

  return (
    <Field.Root
      invalid={Boolean(error)}
      disabled={isDisabled}
      className={fieldSlot()}
    >
      {isGroup ? (
        // ToggleGroup ignores Field's description ids, so the group carries the hint.
        <Fieldset.Root
          aria-describedby={hint ? hintId : undefined}
          className={fieldSlot()}
        >
          <div className={labelRow()}>
            <Fieldset.Legend id={labelId} className={labelSlot()}>
              {labelContent}
            </Fieldset.Legend>
            {badge}
          </div>
          {description}
          {children}
        </Fieldset.Root>
      ) : (
        <>
          <div className={labelRow()}>
            <FieldLabel id={labelId} className={labelSlot()}>
              {labelContent}
            </FieldLabel>
            {badge}
          </div>
          {description}
          {children}
        </>
      )}
      {error && (
        <Field.Error match={true} role="alert" className={errorSlot()}>
          {error}
        </Field.Error>
      )}
    </Field.Root>
  );
};
