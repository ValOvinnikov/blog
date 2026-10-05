import type { InferResultType } from 'groqd';

import type { faqQuestionsQuery } from './query';

export type TRawFaqModuleQuestions = InferResultType<
  typeof faqQuestionsQuery
>[number];

export function toFaqModuleQuestions(
  raw: TRawFaqModuleQuestions[],
  ids: string[],
): TRawFaqModuleQuestions[] {
  const byId = new Map(raw.map((module) => [module._id, module]));

  return ids.flatMap((id) => byId.get(id) ?? []);
}
