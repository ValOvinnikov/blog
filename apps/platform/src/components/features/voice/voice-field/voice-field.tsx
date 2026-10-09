'use client';

import { Field } from '@base-ui/react/field';
import {
  VOICE_FIELD_KIND,
  VOICE_PORTABLE_TEXT_SCHEMA,
  SIZE,
  type TVoiceFieldKind,
  type TVoicePortableText,
} from '@blog/config';
import { VoiceFieldStatus } from '@platform/components/features/voice/voice-field-status';
import { Button } from '@platform/components/shared/button';
import { PortableTextEditor } from '@platform/components/shared/portable-text-editor';
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
    hint: hintSlot,
    actions,
    note,
    token,
    error: errorSlot,
  } = voiceFieldVariants();

  const hintId = `${inputId}-hint`;
  const noteId = `${inputId}-note`;
  const errorId = `${inputId}-error`;
  const label = tLabels(field.id);
  const isRich = field.kind === VOICE_FIELD_KIND.RICH;
  const textValue = typeof value === 'string' ? value : '';
  const isCustomised = isVoiceValueCustomised(value);
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
          {isRich ? (
            <span className={labelSlot()}>{label}</span>
          ) : (
            <Field.Label className={labelSlot()}>{label}</Field.Label>
          )}
          <Field.Description
            id={hintId}
            render={<span />}
            className={hintSlot()}
          >
            {tHints(field.id)}
          </Field.Description>
        </div>
        <div className={actions()}>
          <VoiceFieldStatus
            isCustomised={isCustomised}
            isUnsaved={!isSameVoiceValue(value, savedValue)}
          />
          {isCustomised && !isReadOnly && (
            <Button size={SIZE.SM} variant="secondary" onClick={reset}>
              {t('reset')}
            </Button>
          )}
        </div>
      </div>
      {isRich ? (
        <PortableTextEditor<TVoicePortableText[number]>
          key={editorRevision}
          id={inputId}
          schema={VOICE_PORTABLE_TEXT_SCHEMA}
          initialValue={Array.isArray(value) ? value : []}
          onChange={(next) =>
            onChange(isBlankPortableTextValue(next) ? null : next)
          }
          ariaLabel={label}
          placeholder={placeholder}
          isInvalid={Boolean(error)}
          isDisabled={isReadOnly}
          aria-describedby={richDescribedBy}
        />
      ) : field.kind === VOICE_FIELD_KIND.MULTILINE ? (
        <Textarea
          id={inputId}
          value={textValue}
          onChange={onChange}
          placeholder={placeholder}
          isReadOnly={isReadOnly}
          rows={3}
        />
      ) : (
        <TextInput
          id={inputId}
          value={textValue}
          onChange={onChange}
          placeholder={placeholder}
          isReadOnly={isReadOnly}
        />
      )}
      {placeholderToken !== undefined && (
        <Field.Description id={noteId} render={<span />} className={note()}>
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
