import type { TLocaleIsoCode } from '@shinefold/config/constants/language';

import type { TVoiceFieldId } from './voice-fields';
import type { TVoicePortableText } from './voice-portable-text';

export type TVoiceOverridesByLocale = Partial<
  Record<TLocaleIsoCode, Record<TVoiceFieldId, string | TVoicePortableText>>
>;
