import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { resolveFaqs } from '@blog/service/shared/transformers/faq/resolve-faqs';
import {
  MOCK_FAQ_MODULE_A_ID,
  MOCK_FAQ_MODULE_B_ID,
  MOCK_FAQ_PAGE_DOCUMENTS,
  MOCK_TRANSLATED_ANSWER,
  MOCK_TRANSLATED_QUESTION,
  MOCK_TRANSLATED_QUESTION_ID,
  MOCK_UNTRANSLATED_ANSWER,
  MOCK_UNTRANSLATED_QUESTION,
  MOCK_UNTRANSLATED_QUESTION_ID,
} from '@blog/service/testing/shared/faq-page-dataset';
import { MOCK_MISSING_ID } from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { faqQuestionsQuery } from './query';
import { toFaqModuleQuestions } from './transformer';

const { EN, NL, FR } = LOCALE_ISO_CODES;

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
  it('lists each question once in the reader language as plain text', async () => {
    const faqs = await runFaqs(NL, [
      MOCK_FAQ_MODULE_A_ID,
      MOCK_FAQ_MODULE_B_ID,
    ]);

    expect(faqs).toEqual([
      {
        id: MOCK_TRANSLATED_QUESTION_ID,
        question: MOCK_TRANSLATED_QUESTION[NL],
        answer: MOCK_TRANSLATED_ANSWER[NL],
      },
    ]);
  });

  it('falls back to the default language per question', async () => {
    const faqs = await runFaqs(FR, [MOCK_FAQ_MODULE_A_ID]);

    expect(faqs).toEqual([
      {
        id: MOCK_TRANSLATED_QUESTION_ID,
        question: MOCK_TRANSLATED_QUESTION[EN],
        answer: MOCK_TRANSLATED_ANSWER[EN],
      },
      {
        id: MOCK_UNTRANSLATED_QUESTION_ID,
        question: MOCK_UNTRANSLATED_QUESTION[FR],
        answer: MOCK_UNTRANSLATED_ANSWER[FR],
      },
    ]);
  });

  it('leaves out a question with no text in either language', async () => {
    const faqs = await runFaqs(EN, [MOCK_FAQ_MODULE_A_ID]);
    const ids = faqs.map(({ id }) => id);

    expect(ids).toEqual([MOCK_TRANSLATED_QUESTION_ID]);
  });

  it('returns the modules in the order of the ids given', async () => {
    const modules = await runFaqModules(EN, [
      MOCK_FAQ_MODULE_B_ID,
      MOCK_FAQ_MODULE_A_ID,
    ]);
    const ids = modules.map(({ _id }) => _id);

    expect(ids).toEqual([MOCK_FAQ_MODULE_B_ID, MOCK_FAQ_MODULE_A_ID]);
  });

  it('returns no questions when no id matches', async () => {
    const faqs = await runFaqs(EN, [MOCK_MISSING_ID]);

    expect(faqs).toEqual([]);
  });
});
