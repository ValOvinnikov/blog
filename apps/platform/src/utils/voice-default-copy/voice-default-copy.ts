import type { TVoiceDraftValue } from '@platform/utils/voice-draft/voice-draft';
import { isVoicePlainCopyOf } from '@platform/utils/voice-portable-text/voice-portable-text';
import { isString } from '@shinefold/utils/primitives';

export const withoutDefaultCopy = (
  value: TVoiceDraftValue,
  defaultText: string,
): TVoiceDraftValue => {
  if (isString(value)) return value === defaultText ? '' : value;
  return value && isVoicePlainCopyOf(value, defaultText) ? null : value;
};
