import { toSocialProfiles } from '@blog/service/shared/transformers/to-social-profiles';
import type { InferResultType } from 'groqd';

import type { footerQuery } from './query';
import type { TFooter } from './types';

export type TRawFooter = NonNullable<InferResultType<typeof footerQuery>>;

export function toFooter(raw: TRawFooter): TFooter {
  return {
    social: toSocialProfiles(raw.social),
  };
}
