'use client';

import { Field } from '@base-ui/react/field';
import { LookFollowSwitch } from '@platform/components/features/look/look-follow-switch';
import type { TLookFieldLock } from '@platform/components/features/look/look-form/use-look-field-lock';
import { FieldLabel } from '@platform/components/shared/field-label';
import { FormFieldControlProvider } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { joinIds } from '@platform/utils/join-ids/join-ids';
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
  lock: TLookFieldLock & { isDisabled?: boolean };
};

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
  const pickerLabelId = useId();
  const { isDisabled = false, isLocked, growthBadgeId, aria } = lock;
  const follows = isUndefined(color);
  const pick = (value: string) => {
    if (!isLocked) onChange(value);
  };
  const { root, colorRow, picker, hexField, hexLabel, hexInput } =
    buttonColorFieldVariants({ isLocked });

  return (
    <div className={root()}>
      <LookFollowSwitch
        label={followLabel}
        isFollowing={follows}
        onFollowChange={(checked) => onChange(checked ? undefined : seedColor)}
        lock={{
          isDisabled,
          isLocked,
          growthBadgeId,
          describedBy: aria.describedBy,
        }}
      />

      {!follows && (
        <div className={colorRow()}>
          <span id={pickerLabelId} hidden={true}>
            {t('pickerAriaLabel')}
          </span>
          <input
            type="color"
            aria-labelledby={joinIds(pickerLabelId, growthBadgeId)}
            aria-describedby={aria.describedBy}
            aria-disabled={isLocked || undefined}
            value={isHexColor(color) ? color.toLowerCase() : seedColor}
            onClick={(event) => {
              if (isLocked) event.preventDefault();
            }}
            onChange={(event) => pick(event.target.value)}
            disabled={isDisabled}
            className={picker()}
          />
          <Field.Root
            invalid={isInvalid}
            disabled={isDisabled}
            className={hexField()}
          >
            <FieldLabel className={hexLabel()}>{t('hexLabel')}</FieldLabel>
            <FormFieldControlProvider
              id={inputId}
              describedBy={aria.describedBy}
              isLocked={isLocked}
            >
              <TextInput
                value={color}
                onChange={(value) => pick(value.trim())}
                className={hexInput()}
              />
            </FormFieldControlProvider>
          </Field.Root>
        </div>
      )}
    </div>
  );
};
