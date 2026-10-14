'use client';

import {
  VOICE_FIELDS,
  type TMaybeUndefined,
  type TVoiceFieldId,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import {
  voiceDefaultText,
  voiceFieldInputId,
  type TVoiceDraftValue,
  type TVoiceField,
  type TVoiceFieldErrors,
  type TVoiceLocaleDraft,
} from '@platform/utils/voice-draft/voice-draft';
import { createContext, useContext, type ReactNode } from 'react';

type TVoiceEditor = {
  locale: TLocaleIsoCode;
  fieldIdPrefix: string;
  values: TVoiceLocaleDraft;
  savedValues: TVoiceLocaleDraft;
  errors: TVoiceFieldErrors;
  openListFieldId: TMaybeUndefined<TVoiceFieldId>;
  setOpenListFieldId: (id: TMaybeUndefined<TVoiceFieldId>) => void;
  setFieldValue: (id: TVoiceFieldId, value: TVoiceDraftValue) => void;
  specimenTheme: TSitePreviewTheme;
};

const VoiceEditorContext =
  createContext<TMaybeUndefined<TVoiceEditor>>(undefined);

const VOICE_FIELD_BY_ID = Object.fromEntries(
  VOICE_FIELDS.map((field) => [field.id, field]),
) as Record<TVoiceFieldId, TVoiceField>;

type TVoiceEditorProviderProps = TVoiceEditor & {
  children: ReactNode;
};

export const VoiceEditorProvider = ({
  children,
  ...editor
}: TVoiceEditorProviderProps) => (
  <VoiceEditorContext.Provider value={editor}>
    {children}
  </VoiceEditorContext.Provider>
);

export const useVoiceEditor = (): TVoiceEditor => {
  const editor = useContext(VoiceEditorContext);
  if (!editor) {
    throw new Error('useVoiceEditor must be used within a VoiceEditorProvider');
  }
  return editor;
};

export const useVoiceFieldState = (fieldId: TVoiceFieldId) => {
  const { locale, fieldIdPrefix, values, savedValues, errors, setFieldValue } =
    useVoiceEditor();
  return {
    inputId: voiceFieldInputId(fieldIdPrefix, fieldId),
    value: values[fieldId],
    savedValue: savedValues[fieldId],
    error: errors[fieldId],
    placeholder: voiceDefaultText(locale, VOICE_FIELD_BY_ID[fieldId]),
    onChange: (value: TVoiceDraftValue) => setFieldValue(fieldId, value),
  };
};
