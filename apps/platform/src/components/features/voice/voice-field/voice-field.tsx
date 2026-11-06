'use client';

import { Field } from '@base-ui/react/field';
import {
  VOICE_FIELD_KIND,
  VOICE_SURFACE,
  type TVoiceFieldKind,
} from '@blog/config';
import { isNull, isUndefined } from '@blog/utils/primitives';
import { useVoiceFieldState } from '@platform/components/features/voice/voice-editor-provider';
import { FormFieldControlProvider } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { Textarea } from '@platform/components/shared/textarea';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { isSameJson } from '@platform/utils/is-same-json/is-same-json';
import { joinIds } from '@platform/utils/join-ids/join-ids';
import {
  isVoiceValueCustomised,
  type TVoiceField,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useState, type FocusEvent } from 'react';

import { VoiceFieldHeader } from './components/voice-field-header';
import { VoiceFieldNote } from './components/voice-field-note';
import { VoiceFieldRichControl } from './components/voice-field-rich-control';
import { useVoiceTextControl } from './use-voice-text-control';
import { voiceFieldVariants } from './voice-field-variants';

export type TVoiceFieldProps = {
  field: Pick<TVoiceField, 'id' | 'placeholders' | 'surface'> & {
    kind: TVoiceFieldKind;
  };
};

export const VoiceField = ({ field }: TVoiceFieldProps) => {
  const { inputId, value, savedValue, error, defaultText, onChange } =
    useVoiceFieldState(field.id);
  const { isArchived: isReadOnly, archivedDescribedBy } =
    useSettingsFormState();
  const tLabels = useTranslations('voiceFieldLabels');
  const tHints = useTranslations('voiceFieldHints');
  const [editorRevision, setEditorRevision] = useState(0);
  const textControl = useVoiceTextControl({ value, defaultText, onChange });
  const { root, input, error: errorSlot } = voiceFieldVariants();

  const hintId = `${inputId}-hint`;
  const noteId = `${inputId}-note`;
  const errorId = `${inputId}-error`;
  const label = tLabels(field.id);
  const isRich = field.kind === VOICE_FIELD_KIND.RICH;
  const isCustomised = isVoiceValueCustomised(value);
  const [placeholderToken] = field.placeholders;
  const richDescribedBy = joinIds(
    archivedDescribedBy,
    hintId,
    !isUndefined(placeholderToken) && noteId,
    error && errorId,
  );

  const showDefaultAgain = () => setEditorRevision((revision) => revision + 1);

  const reset = () => {
    onChange(isRich ? null : '');
    textControl.clearTypedText();
    showDefaultAgain();
  };

  const handleBlur = ({ currentTarget, relatedTarget }: FocusEvent) => {
    textControl.clearTypedText();
    if (isRich && isNull(value) && !currentTarget.contains(relatedTarget)) {
      showDefaultAgain();
    }
  };

  return (
    <Field.Root className={root()} invalid={Boolean(error)} onBlur={handleBlur}>
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
        <VoiceFieldRichControl
          key={editorRevision}
          fieldId={field.id}
          label={label}
          describedBy={richDescribedBy}
          isInvalid={Boolean(error)}
          tokens={field.placeholders}
        />
      ) : (
        <FormFieldControlProvider
          id={inputId}
          describedBy={archivedDescribedBy}
        >
          {field.kind === VOICE_FIELD_KIND.MULTILINE ? (
            <Textarea
              value={textControl.shownText}
              onChange={textControl.onChange}
              isReadOnly={isReadOnly}
              rows={3}
            />
          ) : (
            <TextInput
              value={textControl.shownText}
              onChange={textControl.onChange}
              isReadOnly={isReadOnly}
              className={input()}
            />
          )}
        </FormFieldControlProvider>
      )}
      {!isUndefined(placeholderToken) && (
        <VoiceFieldNote id={noteId} placeholderToken={placeholderToken} />
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
