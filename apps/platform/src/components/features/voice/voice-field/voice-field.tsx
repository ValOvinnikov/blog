'use client';

import { Field } from '@base-ui/react/field';
import {
  SIZE,
  VOICE_FIELD_KIND,
  VOICE_PORTABLE_TEXT_SCHEMA,
  VOICE_SURFACE,
  type TVoiceFieldKind,
  type TVoicePortableText,
} from '@blog/config';
import { isString, isUndefined } from '@blog/utils/primitives';
import { useVoiceFieldState } from '@platform/components/features/voice/voice-editor-provider';
import { FormFieldControlProvider } from '@platform/components/shared/form-field';
import { PortableTextEditor } from '@platform/components/shared/portable-text-editor';
import { textVariants } from '@platform/components/shared/text/text-variants';
import { TextInput } from '@platform/components/shared/text-input';
import { Textarea } from '@platform/components/shared/textarea';
import { CONTROL_MODE } from '@platform/constants/control-mode';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { isSameJson } from '@platform/utils/is-same-json/is-same-json';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import { isBlankPortableTextValue } from '@platform/utils/portable-text-schema/portable-text-schema';
import {
  isVoiceValueCustomised,
  type TVoiceField,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { VoiceFieldHeader } from './components/voice-field-header';
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
  const { root, token, error: errorSlot } = voiceFieldVariants();

  const hintId = `${inputId}-hint`;
  const noteId = `${inputId}-note`;
  const errorId = `${inputId}-error`;
  const label = tLabels(field.id);
  const isRich = field.kind === VOICE_FIELD_KIND.RICH;
  const isCustomised = isVoiceValueCustomised(value);
  const textValue = isString(value) ? value : '';
  const [placeholderToken] = field.placeholders;
  const richDescribedBy = joinIds(
    archivedDescribedBy,
    hintId,
    !isUndefined(placeholderToken) && noteId,
    error && errorId,
  );

  const reset = () => {
    onChange(isRich ? null : '');
    setEditorRevision((revision) => revision + 1);
  };

  return (
    <Field.Root className={root()} invalid={Boolean(error)}>
      <VoiceFieldHeader
        label={label}
        hint={tHints(field.id)}
        hintId={hintId}
        isRich={isRich}
        isInListRow={field.surface === VOICE_SURFACE.ARCHIVE}
        isCustomised={isCustomised}
        isUnsaved={!isSameJson(value, savedValue)}
        onReset={isCustomised && !isReadOnly ? reset : undefined}
      />
      {isRich ? (
        <PortableTextEditor<TVoicePortableText[number]>
          key={editorRevision}
          field={{
            label,
            id: inputId,
            isInvalid: Boolean(error),
            describedBy: richDescribedBy,
            tokens: field.placeholders,
          }}
          schema={VOICE_PORTABLE_TEXT_SCHEMA}
          initialValue={Array.isArray(value) ? value : []}
          onChange={(next) =>
            onChange(isBlankPortableTextValue(next) ? null : next)
          }
          placeholder={placeholder}
          mode={isReadOnly ? CONTROL_MODE.READ_ONLY : CONTROL_MODE.EDITABLE}
          size={SIZE.SM}
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
      {!isUndefined(placeholderToken) && (
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
