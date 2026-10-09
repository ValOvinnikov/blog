import { Field } from '@base-ui/react/field';
import { Fieldset } from '@base-ui/react/fieldset';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { useTranslations } from 'next-intl';
import { useId, type ReactNode } from 'react';

import { lookFieldVariants } from './look-field-variants';

export type TLookFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  isOptional?: boolean;
  isGroup?: boolean;
  id?: string;
  children: ReactNode;
};

export const LookField = ({
  label,
  hint,
  error,
  isOptional = false,
  isGroup = false,
  id,
  children,
}: TLookFieldProps) => {
  const t = useTranslations('lookForm');
  const hintId = useId();
  const {
    root,
    group,
    label: labelSlot,
    hint: hintSlot,
    error: errorSlot,
  } = lookFieldVariants();

  const labelContent = (
    <>
      {label}
      {isOptional && (
        <>
          {' '}
          <StatusBadge hasDot={false}>{t('optionalTag')}</StatusBadge>
        </>
      )}
    </>
  );
  const description = hint && (
    <Field.Description id={hintId} className={hintSlot()}>
      {hint}
    </Field.Description>
  );

  return (
    <Field.Root id={id} className={root()} invalid={Boolean(error)}>
      {isGroup ? (
        // ToggleGroup ignores Field's description ids, so the group carries the hint.
        <Fieldset.Root
          aria-describedby={hint ? hintId : undefined}
          className={group()}
        >
          <Fieldset.Legend className={labelSlot()}>
            {labelContent}
          </Fieldset.Legend>
          {description}
          {children}
        </Fieldset.Root>
      ) : (
        <>
          <Field.Label className={labelSlot()}>{labelContent}</Field.Label>
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
