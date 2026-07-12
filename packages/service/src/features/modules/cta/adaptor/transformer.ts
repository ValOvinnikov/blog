import type { InferResultType } from 'groqd';

import { toLink } from '#/shared/transformers/to-link';

import type { ctaModuleQuery } from './query';
import type { TCtaModule } from './types';

export type TRawCtaModule = InferResultType<typeof ctaModuleQuery>;

export function toCtaModule(raw: TRawCtaModule): TCtaModule {
  return {
    heading: raw.heading,
    text: raw.text ?? undefined,
    action: toLink(raw.action),
  };
}
