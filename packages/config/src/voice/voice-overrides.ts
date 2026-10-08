import type { TLocaleIsoCode } from '@blog/config/constants/language';

import type { TVoiceFieldId } from './voice-fields';
import type { TVoicePortableText } from './voice-portable-text';

export type TVoiceOverridesByLocale = Partial<
  Record<TLocaleIsoCode, Record<TVoiceFieldId, string | TVoicePortableText>>
>;
