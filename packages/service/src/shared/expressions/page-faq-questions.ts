import { z } from 'zod';

export const PAGE_FAQ_QUESTIONS_EXPRESSION =
  'coalesce(modules[]->{ _type, questions[]->{ "id": _id, question, "answer": pt::text(answer) } }[_type == "module_faq"].questions[], [])';

export const pageFaqQuestionsParser = z.array(
  z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  }),
);
