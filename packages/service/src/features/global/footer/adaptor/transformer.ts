import type { InferResultType } from 'groqd';

import { toLink } from '#/shared/transformers/to-link';

import type { footerQuery } from './query';
import type { TFooter } from './types';

export type TRawFooter = NonNullable<InferResultType<typeof footerQuery>>;

export function toFooter(raw: TRawFooter): TFooter {
  return {
    social: (raw.social ?? []).flatMap((item) => toLink(item) ?? []),
  };
}
