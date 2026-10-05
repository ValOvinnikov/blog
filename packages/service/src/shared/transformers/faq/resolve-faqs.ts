import { portableTextToPlainText } from '@blog/config';
import type { TFaqModuleQuestions } from '@blog/service/shared/adaptors/faq-questions/types';

export type TFaqPageQuestion = {
  id: string;
  question: string;
  answer: string;
};

type TQuestion = NonNullable<TFaqModuleQuestions['questions']>[number];

type TAnswerBlock = NonNullable<TQuestion['answer']>[number];

function answerToPlainText(blocks: TAnswerBlock[] | null) {
  return portableTextToPlainText(
    blocks?.map((block) => ({
      _type: 'block',
      _key: block._key,
      style: 'normal',
      children: (block.children ?? []).map((span) => ({
        _type: 'span',
        _key: span._key,
        text: span.text ?? '',
      })),
    })),
  );
}

export function resolveFaqs(
  modules: TFaqModuleQuestions[],
): TFaqPageQuestion[] {
  const seen = new Set<string>();
  const faqs: TFaqPageQuestion[] = [];

  for (const { questions } of modules) {
    for (const { _id, question, answer: blocks } of questions ?? []) {
      if (seen.has(_id)) continue;

      const answer = answerToPlainText(blocks);
      if (!question || !answer) continue;

      seen.add(_id);
      faqs.push({ id: _id, question, answer });
    }
  }

  return faqs;
}
