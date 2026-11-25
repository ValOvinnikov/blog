import { toCtaButtons } from '@shinefold/service/shared/transformers/cta/to-cta-buttons';
import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
import { toModuleAppearance } from '@shinefold/service/shared/transformers/module/to-module-appearance';
import { toPortableText } from '@shinefold/service/shared/transformers/portable-text/to-portable-text-mark-def';
import type { InferResultType } from 'groqd';

import type { faqModuleQuery } from './query';
import type { TFaqModule, TFaqQuestion } from './types';

export type TRawFaqModule = InferResultType<typeof faqModuleQuery>;

type TRawFaqQuestion = TRawFaqModule['questions'][number];

function toFaqQuestion(raw: TRawFaqQuestion): TFaqQuestion {
  return {
    id: raw._id,
    question: raw.question,
    answer: raw.answer.map(toPortableText),
  };
}

export function toFaqModule(raw: TRawFaqModule): TFaqModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    questions: raw.questions.map(toFaqQuestion),
    ctaButtons: toCtaButtons(raw.ctaButtons),
    contentAlignment: raw.contentAlignment ?? undefined,
    layout: toLayout(raw.layout),
    ...toModuleAppearance(raw),
  };
}
