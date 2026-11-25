import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import { toPortableText } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { InferResultType } from 'groqd';

import type { contactFormModuleQuery } from './query';
import type { TContactFormModule } from './types';

export type TRawContactFormModule = InferResultType<
  typeof contactFormModuleQuery
>;

export function toContactFormModule(
  raw: TRawContactFormModule,
): TContactFormModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    successMessage: raw.successMessage,
    privacyNote: raw.privacyNote?.map(toPortableText) ?? undefined,
    layout: toLayout(raw.layout),
    contentAlignment: raw.contentAlignment ?? undefined,
  };
}
