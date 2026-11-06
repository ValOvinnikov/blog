import { VOICE_FIELDS, type TVoiceFieldId } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { VoiceEditorProvider } from '@platform/components/features/voice/voice-editor-provider';
import { VoiceField } from '@platform/components/features/voice/voice-field';
import { MOCK_SITE_PREVIEW_THEME } from '@platform/testing/site-preview-theme';
import {
  localeDraftOf,
  withVoiceValue,
  type TVoiceDraftValue,
  type TVoiceFieldErrors,
} from '@platform/utils/voice-draft/voice-draft';
import { buildVoiceDraft } from '@platform/utils/voice-draft-builder/voice-draft-builder';
import { useState, type ComponentProps } from 'react';

const { EN } = LOCALE_ISO_CODES;

export const MOCK_FIELD_ID_PREFIX = 'voice-field-test';

export const fieldById = (id: TVoiceFieldId) =>
  VOICE_FIELDS.find((field) => field.id === id)!;

type TVoiceFieldInEditorProps = ComponentProps<typeof VoiceField> & {
  value: TVoiceDraftValue;
  savedValue?: TVoiceDraftValue;
  errors: TVoiceFieldErrors;
  onSetFieldValue: (id: TVoiceFieldId, value: TVoiceDraftValue) => void;
};

export const VoiceFieldInEditor = ({
  field,
  value,
  savedValue = value,
  errors,
  onSetFieldValue,
}: TVoiceFieldInEditorProps) => {
  const [draftValue, setDraftValue] = useState(value);
  const values = localeDraftOf(
    withVoiceValue(buildVoiceDraft({}, [EN]), EN, field.id, draftValue),
    EN,
  );
  const savedValues = localeDraftOf(
    withVoiceValue(buildVoiceDraft({}, [EN]), EN, field.id, savedValue),
    EN,
  );
  return (
    <VoiceEditorProvider
      locale={EN}
      fieldIdPrefix={MOCK_FIELD_ID_PREFIX}
      values={values}
      savedValues={savedValues}
      errors={errors}
      openListFieldId={undefined}
      setOpenListFieldId={vi.fn()}
      setFieldValue={(id, next) => {
        onSetFieldValue(id, next);
        setDraftValue(next);
      }}
      specimenTheme={MOCK_SITE_PREVIEW_THEME}
    >
      <VoiceField field={field} />
    </VoiceEditorProvider>
  );
};
