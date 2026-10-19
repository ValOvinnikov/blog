import type {
  TFieldErrorsByLocale,
  TReasonedFailure,
} from '@blog/config/types';

import type { TValueOf } from '@blog/config/utils';

import type { TVoiceFieldId } from './voice-fields';

export const VOICE_FIELD_ERROR = {
  NOT_A_STRING: 'NOT_A_STRING',
  NOT_RICH_TEXT: 'NOT_RICH_TEXT',
  LINE_BREAK: 'LINE_BREAK',
  TOO_LONG: 'TOO_LONG',
  MISSING_PLACEHOLDER: 'MISSING_PLACEHOLDER',
  UNKNOWN_PLACEHOLDER: 'UNKNOWN_PLACEHOLDER',
  DISALLOWED_CONTENT: 'DISALLOWED_CONTENT',
  INVALID_LINK_URL: 'INVALID_LINK_URL',
} as const;

export type TVoiceFieldErrorReason = TValueOf<typeof VOICE_FIELD_ERROR>;

export type TVoiceFieldFailure = TReasonedFailure<TVoiceFieldErrorReason>;

export type TVoiceFieldFailuresByLocale = TFieldErrorsByLocale<
  TVoiceFieldId,
  TVoiceFieldErrorReason
>;
