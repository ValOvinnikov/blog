'use client';

import { Field } from '@base-ui/react/field';
import {
  VOICE_FIELD_KIND,
  VOICE_PORTABLE_TEXT_SCHEMA,
  VOICE_SURFACE,
  type TVoiceFieldKind,
  type TVoicePortableText,
} from '@blog/config';
import { useVoiceFieldState } from '@platform/components/features/voice/voice-editor-provider';
import { FieldResetButton } from '@platform/components/shared/field-reset-button';
import { FieldStatus } from '@platform/components/shared/field-status';
import { FormFieldControlProvider } from '@platform/components/shared/form-field';
import { PortableTextEditor } from '@platform/components/shared/portable-text-editor';
import { textVariants } from '@platform/components/shared/text/text-variants';
import { TextInput } from '@platform/components/shared/text-input';
import { Textarea } from '@platform/components/shared/textarea';
import { CONTROL_MODE } from '@platform/constants/control-mode';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { isSameJson } from '@platform/utils/is-same-json/is-same-json';
import { isBlankPortableTextValue } from '@platform/utils/portable-text-schema/portable-text-schema';
import {
  isVoiceValueCustomised,
  type TVoiceField,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { voiceFieldVariants } from './voice-field-variants';

export type TVoiceFieldProps = {
  field: Pick<TVoiceField, 'id' | 'placeholders' | 'surface'> & {
    kind: TVoiceFieldKind;
  };
};

export const VoiceField = ({ field }: TVoiceFieldProps) => {
  const { inputId, value, savedValue, error, placeholder, onChange } =
    useVoiceFieldState(field.id);
  const t = useTranslations('voiceSettings');
  const { isArchived: isReadOnly, archivedDescribedBy } =
    useSettingsFormState();
  const tLabels = useTranslations('voiceFieldLabels');
  const tHints = useTranslations('voiceFieldHints');
  const [editorRevision, setEditorRevision] = useState(0);
  const hasVisibleLabel = field.surface !== VOICE_SURFACE.ARCHIVE;
  const {
    root,
    header,
    status,
    labelGroup,
    label: labelSlot,
    token,
    error: errorSlot,
  } = voiceFieldVariants({ hasVisibleLabel });

  const hintId = `${inputId}-hint`;
  const noteId = `${inputId}-note`;
  const errorId = `${inputId}-error`;
  const label = tLabels(field.id);
  const isRich = field.kind === VOICE_FIELD_KIND.RICH;
  const isCustomised = isVoiceValueCustomised(value);
  const textValue = typeof value === 'string' ? value : '';
  const [placeholderToken] = field.placeholders;
  const richDescribedBy = [
    archivedDescribedBy,
    hintId,
    placeholderToken !== undefined && noteId,
    error && errorId,
  ]
    .filter(Boolean)
    .join(' ');

  const reset = () => {
    onChange(isRich ? null : '');
    setEditorRevision((revision) => revision + 1);
  };

  return (
    <Field.Root className={root()} invalid={Boolean(error)}>
      <div className={header()}>
        <div className={labelGroup()}>
          {isRich ? (
            hasVisibleLabel && <span className={labelSlot()}>{label}</span>
          ) : (
            <Field.Label className={labelSlot()}>{label}</Field.Label>
          )}
          <Field.Description
            id={hintId}
            render={<span />}
            className={textVariants({ variant: 'hint' })}
          >
            {tHints(field.id)}
          </Field.Description>
        </div>
        <div className={status()}>
          <FieldStatus
            isCustomised={isCustomised}
            isUnsaved={!isSameJson(value, savedValue)}
          />
          {isCustomised && !isReadOnly && <FieldResetButton onReset={reset} />}
        </div>
      </div>
      {isRich ? (
        <PortableTextEditor<TVoicePortableText[number]>
          key={editorRevision}
          field={{ label, id: inputId, isInvalid: Boolean(error) }}
          schema={VOICE_PORTABLE_TEXT_SCHEMA}
          initialValue={Array.isArray(value) ? value : []}
          onChange={(next) =>
            onChange(isBlankPortableTextValue(next) ? null : next)
          }
          placeholder={placeholder}
          mode={isReadOnly ? CONTROL_MODE.READ_ONLY : CONTROL_MODE.EDITABLE}
          aria-describedby={richDescribedBy}
        />
      ) : (
        <FormFieldControlProvider
          id={inputId}
          describedBy={archivedDescribedBy}
        >
          {field.kind === VOICE_FIELD_KIND.MULTILINE ? (
            <Textarea
              value={textValue}
              onChange={onChange}
              placeholder={placeholder}
              isReadOnly={isReadOnly}
              rows={3}
            />
          ) : (
            <TextInput
              value={textValue}
              onChange={onChange}
              placeholder={placeholder}
              isReadOnly={isReadOnly}
            />
          )}
        </FormFieldControlProvider>
      )}
      {placeholderToken !== undefined && (
        <Field.Description
          id={noteId}
          render={<span />}
          className={textVariants({ variant: 'hint' })}
        >
          {t.rich('keepPlaceholder', {
            token: `{${placeholderToken}}`,
            code: (chunks) => <code className={token()}>{chunks}</code>,
          })}
        </Field.Description>
      )}
      {error && (
        <Field.Error
          id={errorId}
          match={true}
          render={<span />}
          className={errorSlot()}
        >
          {error}
        </Field.Error>
      )}
    </Field.Root>
  );
};
