'use client';

import { Field } from '@base-ui/react/field';
import {
  CONTROL_MODE,
  VOICE_FIELD_KIND,
  VOICE_PORTABLE_TEXT_SCHEMA,
  type TVoiceFieldKind,
  type TVoicePortableText,
} from '@blog/config';
import { FieldStatus } from '@platform/components/shared/field-status';
import { PortableTextEditor } from '@platform/components/shared/portable-text-editor';
import { textVariants } from '@platform/components/shared/text/text-variants';
import { TextInput } from '@platform/components/shared/text-input';
import { Textarea } from '@platform/components/shared/textarea';
import { isBlankPortableTextValue } from '@platform/utils/portable-text-schema/portable-text-schema';
import {
  isSameVoiceValue,
  isVoiceValueCustomised,
  type TVoiceDraftValue,
  type TVoiceField,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { voiceFieldVariants } from './voice-field-variants';

export type TVoiceFieldProps = {
  inputId: string;
  field: Pick<TVoiceField, 'id' | 'placeholders'> & { kind: TVoiceFieldKind };
  value: TVoiceDraftValue;
  savedValue: TVoiceDraftValue;
  placeholder: string;
  error?: string;
  onChange: (value: TVoiceDraftValue) => void;
  isReadOnly: boolean;
  hasVisibleLabel?: boolean;
};

export const VoiceField = ({
  inputId,
  field,
  value,
  savedValue,
  placeholder,
  error,
  onChange,
  isReadOnly,
  hasVisibleLabel = true,
}: TVoiceFieldProps) => {
  const t = useTranslations('voiceSettings');
  const tLabels = useTranslations('voiceFieldLabels');
  const tHints = useTranslations('voiceFieldHints');
  const [editorRevision, setEditorRevision] = useState(0);
  const {
    root,
    header,
    labelGroup,
    label: labelSlot,
    token,
    error: errorSlot,
  } = voiceFieldVariants();

  const hintId = `${inputId}-hint`;
  const noteId = `${inputId}-note`;
  const errorId = `${inputId}-error`;
  const label = tLabels(field.id);
  const isRich = field.kind === VOICE_FIELD_KIND.RICH;
  const textValue = typeof value === 'string' ? value : '';
  const [placeholderToken] = field.placeholders;
  const richDescribedBy = [
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
          {hasVisibleLabel &&
            (isRich ? (
              <span className={labelSlot()}>{label}</span>
            ) : (
              <Field.Label className={labelSlot()}>{label}</Field.Label>
            ))}
          <Field.Description
            id={hintId}
            render={<span />}
            className={textVariants({ variant: 'hint' })}
          >
            {tHints(field.id)}
          </Field.Description>
        </div>
        <FieldStatus
          isCustomised={isVoiceValueCustomised(value)}
          isUnsaved={!isSameVoiceValue(value, savedValue)}
          onReset={isReadOnly ? undefined : reset}
        />
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
      ) : field.kind === VOICE_FIELD_KIND.MULTILINE ? (
        <Textarea
          id={inputId}
          value={textValue}
          onChange={onChange}
          placeholder={placeholder}
          isReadOnly={isReadOnly}
          ariaLabel={hasVisibleLabel ? undefined : label}
          rows={3}
        />
      ) : (
        <TextInput
          id={inputId}
          value={textValue}
          onChange={onChange}
          placeholder={placeholder}
          isReadOnly={isReadOnly}
          ariaLabel={hasVisibleLabel ? undefined : label}
        />
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
