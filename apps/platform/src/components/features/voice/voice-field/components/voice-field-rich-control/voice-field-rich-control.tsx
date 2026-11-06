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
import { isBlankPortableTextValue } from '@platform/utils/portable-text-schema/portable-text-schema';
import { isVoicePlainCopyOf } from '@platform/utils/voice-draft/voice-draft';

export type TVoiceFieldRichControlProps = {
  fieldId: TVoiceFieldId;
  label: string;
  describedBy: TMaybeUndefined<string>;
  isInvalid: boolean;
  tokens: readonly string[];
};

export const VoiceFieldRichControl = ({
  fieldId,
  label,
  describedBy,
  isInvalid,
  tokens,
}: TVoiceFieldRichControlProps) => {
  const { inputId, value, defaultText, defaultBlocks, onChange } =
    useVoiceFieldState(fieldId);
  const { isArchived } = useSettingsFormState();

  return (
    <PortableTextEditor<TVoicePortableText[number]>
      field={{ label, id: inputId, isInvalid, describedBy, tokens }}
      schema={VOICE_PORTABLE_TEXT_SCHEMA}
      initialValue={Array.isArray(value) ? value : defaultBlocks}
      onChange={(next) =>
        onChange(
          isBlankPortableTextValue(next) ||
            isVoicePlainCopyOf(next, defaultText)
            ? null
            : next,
        )
      }
      mode={isArchived ? CONTROL_MODE.READ_ONLY : CONTROL_MODE.EDITABLE}
      size={SIZE.SM}
    />
  );
};
