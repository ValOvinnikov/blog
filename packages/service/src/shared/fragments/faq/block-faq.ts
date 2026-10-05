import type { Block_faq } from '@blog/config';
import { getLocalizedField } from '@blog/service/shared/localization/get-localized-field/get-localized-field';
import { getLocalizedPortableTextBlock } from '@blog/service/shared/localization/get-localized-portable-text-block/get-localized-portable-text-block';
import type { GroqBuilderSubquery, QueryConfig } from 'groqd';

export function blockFaqProjection<TConfig extends QueryConfig>(
  sub: GroqBuilderSubquery<Block_faq, TConfig>,
) {
  return {
    _id: true as const,
    question: getLocalizedField(sub, 'question'),
    answer: getLocalizedPortableTextBlock(sub, 'answer'),
  };
}
