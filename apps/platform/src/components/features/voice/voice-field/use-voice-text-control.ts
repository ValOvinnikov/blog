import type { TMaybeNull } from '@blog/config';
import { isString } from '@blog/utils/primitives';
import {
  isVoiceValueCustomised,
  type TVoiceDraftValue,
} from '@platform/utils/voice-draft/voice-draft';
import { useState } from 'react';

type TUseVoiceTextControlParams = {
  value: TVoiceDraftValue;
  defaultText: string;
  onChange: (value: string) => void;
};

export const useVoiceTextControl = ({
  value,
  defaultText,
  onChange,
}: TUseVoiceTextControlParams) => {
  const [typedText, setTypedText] = useState<TMaybeNull<string>>(null);
  const draftText = isString(value) ? value : '';

  return {
    shownText:
      typedText ?? (isVoiceValueCustomised(value) ? draftText : defaultText),
    onChange: (next: string) => {
      setTypedText(next);
      onChange(next === defaultText || next.trim() === '' ? '' : next);
    },
    onBlur: () => setTypedText(null),
  };
};
