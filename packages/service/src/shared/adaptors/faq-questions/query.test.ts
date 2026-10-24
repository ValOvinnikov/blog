import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { resolveFaqs } from '@blog/service/shared/transformers/faq/resolve-faqs';
import { MOCK_FAQ_PAGE_DOCUMENTS } from '@blog/service/testing/shared/faq-page-dataset';
import { MOCK_MISSING_ID } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { faqQuestionsQuery } from './query';
import { toFaqModuleQuestions } from './transformer';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MODULE_A_ID = 'module-faq-a';
const MODULE_B_ID = 'module-faq-b';
const TRANSLATED_QUESTION_ID = 'question-ok';

async function runFaqModules(locale: string, ids: string[]) {
  const raw = await evaluateGroqExpression(
    faqQuestionsQuery.query,
    MOCK_FAQ_PAGE_DOCUMENTS,
    null,
    { ids, locale, defaultLocale: EN },
  );

  return toFaqModuleQuestions(faqQuestionsQuery.parse(raw), ids);
}

async function runFaqs(locale: string, ids: string[]) {
  return resolveFaqs(await runFaqModules(locale, ids));
}

describe('faqQuestionsQuery', () => {
  it('lists each question once in the reader language with plain-text answers', async () => {
    const faqs = await runFaqs(NL, [MODULE_A_ID, MODULE_B_ID]);

    expect(faqs).toEqual([
      {
        id: TRANSLATED_QUESTION_ID,
        question: 'Hoeveel?',
        answer: 'Dat hangt ervan af.',
      },
    ]);
  });

  it('falls back to the default language per question', async () => {
    const faqs = await runFaqs(FR, [MODULE_A_ID]);

    expect(faqs).toEqual([
      {
        id: TRANSLATED_QUESTION_ID,
        question: 'How much?',
        answer: 'It depends.',
      },
      {
        id: 'question-untranslated',
        question: 'Combien?',
        answer: 'Ça dépend.',
      },
    ]);
  });

  it('leaves out a question with no text in either language', async () => {
    const faqs = await runFaqs(EN, [MODULE_A_ID]);

    expect(faqs.map(({ id }) => id)).toEqual([TRANSLATED_QUESTION_ID]);
  });

  it('returns the modules in the order of the ids given', async () => {
    const modules = await runFaqModules(EN, [MODULE_B_ID, MODULE_A_ID]);

    expect(modules.map(({ _id }) => _id)).toEqual([MODULE_B_ID, MODULE_A_ID]);
  });

  it('returns no modules when no id matches', async () => {
    const faqs = await runFaqs(EN, [MOCK_MISSING_ID]);

    expect(faqs).toEqual([]);
  });
});
