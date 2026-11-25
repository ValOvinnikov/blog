'use client';

import { Field } from '@base-ui/react/field';
import type { TLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { FieldLabel } from '@platform/components/shared/field-label';
import { FormFieldControlProvider } from '@platform/components/shared/form-field';
import { Switch } from '@platform/components/shared/switch';
import { TextInput } from '@platform/components/shared/text-input';
import type { TMaybeUndefined } from '@shinefold/config';
import { isHexColor } from '@shinefold/utils/color';
import { isUndefined } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { buttonColorFieldVariants } from './button-color-field-variants';

export type TButtonColorFieldProps = {
  color: TMaybeUndefined<string>;
  seedColor: string;
  onChange: (color: TMaybeUndefined<string>) => void;
  followLabel: string;
  inputId: string;
  isInvalid: boolean;
  lock: TLookFieldLock;
};

/** Following is the field's own state rather than a seeded value, so a colour that happens to match the accent still reads as picked. */
export const ButtonColorField = ({
  color,
  seedColor,
  onChange,
  followLabel,
  inputId,
  isInvalid,
  lock,
}: TButtonColorFieldProps) => {
  const t = useTranslations('buttonColorField');
  const captionId = useId();
  const { isDisabled, isLocked, growthBadgeId, aria } = lock;
  const follows = isUndefined(color);
  const { root, switchRow, colorRow, picker, hexField, hexLabel, hexInput } =
    buttonColorFieldVariants();

  return (
    <div className={root()}>
      <div className={switchRow()}>
        <Switch
          aria={
            growthBadgeId
              ? {
                  labelledBy: `${captionId} ${growthBadgeId}`,
                  describedBy: aria.describedBy,
                }
              : { label: followLabel, describedBy: aria.describedBy }
          }
          isChecked={follows}
          onCheckedChange={(checked) =>
            onChange(checked ? undefined : seedColor)
          }
          labels={{ caption: followLabel, captionId }}
          isDisabled={isDisabled}
          isLocked={isLocked}
        />
      </div>

      {!follows && (
        <div className={colorRow()}>
          <input
            type="color"
            aria-label={t('pickerAriaLabel')}
            value={isHexColor(color) ? color.toLowerCase() : seedColor}
            onChange={(event) => onChange(event.target.value)}
            disabled={isDisabled || isLocked}
            aria-describedby={aria.describedBy}
            className={picker()}
          />
          <Field.Root
            invalid={isInvalid}
            disabled={isDisabled || isLocked}
            className={hexField()}
          >
            <FieldLabel className={hexLabel()}>{t('hexLabel')}</FieldLabel>
            <FormFieldControlProvider
              id={inputId}
              describedBy={aria.describedBy}
            >
              <TextInput
                value={color}
                onChange={(value) => onChange(value.trim())}
                className={hexInput()}
              />
            </FormFieldControlProvider>
          </Field.Root>
        </div>
      )}
    </div>
  );
};
