import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import type { IWithChildren } from '@blog/config/react';
import type { TLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { FieldLabel } from '@platform/components/shared/field-label';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { isBrandAssetKind } from '@platform/utils/look-form-values/look-form-values';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

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
  const t = useTranslations('lookForm');
  const hintId = useId();
  const {
    field: fieldSlot,
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
  const description = (
    <>
      {hint && (
        <Field.Description id={hintId} className={hintSlot()}>
          {hint}
        </Field.Description>
      )}
      {lock && <LockedReason id={lock.id}>{lock.reason}</LockedReason>}
    </>
  );

  return (
    <Field.Root invalid={Boolean(error)} className={fieldSlot()}>
      {isGroup ? (
        // ToggleGroup ignores Field's description ids, so the group carries the hint.
        <Fieldset.Root
          aria-describedby={hint ? hintId : undefined}
          className={fieldSlot()}
        >
          <Fieldset.Legend className={labelSlot()}>
            {labelContent}
          </Fieldset.Legend>
          {description}
          {children}
        </Fieldset.Root>
      ) : (
        <>
          <FieldLabel className={labelSlot()}>{labelContent}</FieldLabel>
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
