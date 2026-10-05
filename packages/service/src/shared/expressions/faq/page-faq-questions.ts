import { z } from 'zod';

function inVisitorLanguage(field: string) {
  return `coalesce(${field}[language == $locale][0].value, ${field}[language == $defaultLocale][0].value)`;
}

export const PAGE_FAQ_QUESTIONS_EXPRESSION = `coalesce(modules[@->_type == "module_faq"]->{ "q": questions[defined(@->_id)]->{ "id": _id, "question": ${inVisitorLanguage('question')}, "answer": pt::text(${inVisitorLanguage('answer')}) } }.q[], [])`;

export const pageFaqQuestionsParser = z.array(
  z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  }),
);
