import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import type { TLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { useLookForm } from '@platform/components/features/look/look-form-provider';
import { FieldLabel } from '@platform/components/shared/field-label';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import { LOOK_FIELD_LABEL_TEST_ID } from '@platform/constants/look-form';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { grantFocusId } from '@platform/utils/grant-focus-id/grant-focus-id';
import type { IWithChildren } from '@shinefold/config/react';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { LookFieldBadge } from './components/look-field-badge/look-field-badge';
import { lookFieldVariants } from './look-field-variants';

export type TLookFieldProps = IWithChildren & {
  field: keyof TLookFormValues;
  label: string;
  hint?: string;
  hintId?: string;
  error?: string;
  isGroup?: boolean;
  lock?: TLookFieldLock;
};

export const LookField = ({
  field,
  label,
  hint,
  hintId: givenHintId,
  error,
  isGroup = false,
  lock,
  children,
}: TLookFieldProps) => {
  const { hasFieldChanged } = useLookForm();
  const { labelId, growthBadgeId } = lock ?? {};
  const t = useTranslations('lookForm');
  const ownHintId = useId();
  const hintId = givenHintId ?? ownHintId;
  const {
    field: fieldSlot,
    labelRow,
    label: labelSlot,
    labelText,
    hint: hintSlot,
    error: errorSlot,
  } = lookFieldVariants();

  const labelContent = (
    <span className={labelText()}>
      <span
        id={grantFocusId(field)}
        tabIndex={-1}
        data-testid={LOOK_FIELD_LABEL_TEST_ID}
      >
        {label}
      </span>
      {hasFieldChanged(field) && (
        <>
          {' '}
          <UnsavedDot label={t('fieldUnsavedLabel')} />
        </>
      )}
    </span>
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
    <Field.Root invalid={Boolean(error)} className={fieldSlot()}>
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
