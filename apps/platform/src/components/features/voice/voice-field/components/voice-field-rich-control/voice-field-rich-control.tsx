'use client';

import {
  SIZE,
  VOICE_PORTABLE_TEXT_SCHEMA,
  type TMaybeUndefined,
  type TVoiceFieldId,
  type TVoicePortableText,
} from '@blog/config';
import { useVoiceFieldState } from '@platform/components/features/voice/voice-editor-provider';
import { PortableTextEditor } from '@platform/components/shared/portable-text-editor';
import { CONTROL_MODE } from '@platform/constants/control-mode';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import { isBlankPortableTextValue } from '@platform/utils/is-blank-portable-text-value/is-blank-portable-text-value';
import {
  toVoiceRichDraft,
  voiceTextToPortableText,
} from '@platform/utils/voice-portable-text/voice-portable-text';

export type TVoiceFieldRichControlProps = {
  fieldId: TVoiceFieldId;
  label: string;
  describedBy: TMaybeUndefined<string>;
  isInvalid: boolean;
  tokens: readonly string[];
  onEmptiedChange: (isEmptied: boolean) => void;
};

export const VoiceFieldRichControl = ({
  fieldId,
  label,
  describedBy,
  isInvalid,
  tokens,
  onEmptiedChange,
}: TVoiceFieldRichControlProps) => {
  const { inputId, value, defaultText, onChange } = useVoiceFieldState(fieldId);
  const { isArchived } = useSettingsFormState();

  return (
    <PortableTextEditor<TVoicePortableText[number]>
      field={{ label, id: inputId, isInvalid, describedBy, tokens }}
      schema={VOICE_PORTABLE_TEXT_SCHEMA}
      initialValue={
        Array.isArray(value)
          ? value
          : voiceTextToPortableText(fieldId, defaultText)
      }
      onChange={(next) => {
        onChange(toVoiceRichDraft(next, defaultText));
        onEmptiedChange(isBlankPortableTextValue(next));
      }}
      mode={isArchived ? CONTROL_MODE.READ_ONLY : CONTROL_MODE.EDITABLE}
      size={SIZE.SM}
    />
  );
};
