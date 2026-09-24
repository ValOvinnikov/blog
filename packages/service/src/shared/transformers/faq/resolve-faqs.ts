import type { pageFaqQuestionsParser } from '@blog/service/shared/expressions/page-faq-questions';
import type { z } from 'zod';

export type TRawFaqPageQuestion = z.infer<
  typeof pageFaqQuestionsParser
>[number];

export type TFaqPageQuestion = {
  id: string;
  question: string;
  answer: string;
};

export function resolveFaqs(raw: TRawFaqPageQuestion[]): TFaqPageQuestion[] {
  const seen = new Set<string>();
  const faqs: TFaqPageQuestion[] = [];

  for (const question of raw) {
    if (seen.has(question.id)) continue;
    seen.add(question.id);
    faqs.push(question);
  }

  return faqs;
}
