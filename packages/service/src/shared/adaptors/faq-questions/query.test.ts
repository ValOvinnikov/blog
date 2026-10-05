import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { resolveFaqs } from '@blog/service/shared/transformers/faq/resolve-faqs';
import { faqPageDocuments } from '@blog/service/testing/shared/faq-page-dataset';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';

import { faqQuestionsQuery } from './query';
import { toFaqModuleQuestions } from './transformer';

const { EN, NL, FR } = LOCALE_ISO_CODES;

async function runFaqs(locale: string, ids: string[]) {
  const raw = await evaluateGroqExpression(
    faqQuestionsQuery.query,
    faqPageDocuments,
    null,
    { ids, locale, defaultLocale: EN },
  );

  return resolveFaqs(toFaqModuleQuestions(faqQuestionsQuery.parse(raw), ids));
}

describe('faqQuestionsQuery', () => {
  it('lists each question once in the reader language with a plain-text answer', async () => {
    expect(await runFaqs(NL, ['module-faq-a', 'module-faq-b'])).toEqual([
      {
        id: 'question-ok',
        question: 'Hoeveel?',
        answer: 'Dat hangt ervan af.',
      },
    ]);
  });

  it('falls back to the default language per question', async () => {
    expect(await runFaqs(FR, ['module-faq-a'])).toEqual([
      { id: 'question-ok', question: 'How much?', answer: 'It depends.' },
      {
        id: 'question-untranslated',
        question: 'Combien?',
        answer: 'Ça dépend.',
      },
    ]);
  });

  it('leaves out a deleted question and one with no text in either language, and still parses', async () => {
    const faqs = await runFaqs(EN, ['module-faq-a']);

    expect(faqs.map(({ id }) => id)).toEqual(['question-ok']);
  });

  it('returns the modules in the order of the ids given', async () => {
    const raw = await evaluateGroqExpression(
      faqQuestionsQuery.query,
      faqPageDocuments,
      null,
      { ids: ['module-faq-b', 'module-faq-a'], locale: EN, defaultLocale: EN },
    );

    const modules = toFaqModuleQuestions(faqQuestionsQuery.parse(raw), [
      'module-faq-b',
      'module-faq-a',
    ]);

    expect(modules.map(({ _id }) => _id)).toEqual([
      'module-faq-b',
      'module-faq-a',
    ]);
  });

  it('returns no modules when no id matches', async () => {
    expect(await runFaqs(EN, ['missing'])).toEqual([]);
  });
});
