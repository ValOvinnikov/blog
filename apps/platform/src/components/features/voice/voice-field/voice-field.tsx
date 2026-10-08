'use client';

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
  voiceFieldInputId,
  type TVoiceDraftValue,
  type TVoiceField,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { voiceFieldVariants } from './voice-field-variants';

export type TVoiceFieldProps = {
  field: Pick<TVoiceField, 'id' | 'placeholders'> & { kind: TVoiceFieldKind };
  value: TVoiceDraftValue;
  savedValue: TVoiceDraftValue;
  placeholder: string;
  error?: string;
  onChange: (value: TVoiceDraftValue) => void;
  isReadOnly: boolean;
};

export const VoiceField = ({
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
    resetButton,
    input,
    note,
    token,
    error: errorSlot,
  } = voiceFieldVariants();

  const inputId = voiceFieldInputId(field.id);
  const labelId = `${inputId}-label`;
  const hintId = `${inputId}-hint`;
  const noteId = `${inputId}-note`;
  const errorId = `${inputId}-error`;
  const label = tLabels(field.id);
  const isRich = field.kind === VOICE_FIELD_KIND.RICH;
  const textValue = typeof value === 'string' ? value : '';
  const isCustomised = isVoiceValueCustomised(value);
  const [placeholderToken] = field.placeholders;
  const describedBy = [
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
    <div className={root()}>
      <div className={header()}>
        <div className={labelGroup()}>
          {isRich ? (
            <span id={labelId} className={labelSlot()}>
              {label}
            </span>
          ) : (
            <label id={labelId} htmlFor={inputId} className={labelSlot()}>
              {label}
            </label>
          )}
          <span id={hintId} className={hintSlot()}>
            {tHints(field.id)}
          </span>
        </div>
        <div className={actions()}>
          <VoiceFieldStatus
            isCustomised={isCustomised}
            isUnsaved={!isSameVoiceValue(value, savedValue)}
          />
          {isCustomised && !isReadOnly && (
            <Button
              size={SIZE.SM}
              variant="secondary"
              onClick={reset}
              className={resetButton()}
            >
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
          aria-describedby={describedBy}
        />
      ) : field.kind === VOICE_FIELD_KIND.MULTILINE ? (
        <Textarea
          id={inputId}
          value={textValue}
          onChange={onChange}
          placeholder={placeholder}
          isReadOnly={isReadOnly}
          hasExternalLabel={true}
          aria-describedby={describedBy}
          rows={3}
          className={input()}
        />
      ) : (
        <TextInput
          id={inputId}
          value={textValue}
          onChange={onChange}
          placeholder={placeholder}
          isInvalid={Boolean(error)}
          isReadOnly={isReadOnly}
          hasExternalLabel={true}
          aria-describedby={describedBy}
          className={input()}
        />
      )}
      {placeholderToken !== undefined && (
        <span id={noteId} className={note()}>
          {t.rich('keepPlaceholder', {
            token: `{${placeholderToken}}`,
            code: (chunks) => <code className={token()}>{chunks}</code>,
          })}
        </span>
      )}
      {error && (
        <span id={errorId} className={errorSlot()}>
          {error}
        </span>
      )}
    </div>
  );
};
